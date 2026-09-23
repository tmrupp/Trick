import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { buildReferenceDeckCards, sharedTimingId } from "./reference_registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_CARD_WIDTH = 1050;
const SOURCE_CARD_HEIGHT = 1470;
const OUTPUT_CARD_WIDTH = 400;
const OUTPUT_CARD_HEIGHT = 560;
const SHEET_WIDTH = 4;
const EXPORT_ROOT = path.join(__dirname, "exports", "tts", "reference", "deck");
const FACE_SHEET_PATH = path.join(EXPORT_ROOT, "trick-reference-face-sheet.png");
const BACK_SHEET_PATH = path.join(EXPORT_ROOT, "trick-reference-back-sheet.png");
const MANIFEST_PATH = path.join(EXPORT_ROOT, "trick-reference-deck-manifest.json");
const README_PATH = path.join(EXPORT_ROOT, "README.md");

const referenceCards = buildReferenceDeckCards();
const timingId = sharedTimingId();
const SHEET_HEIGHT = Math.ceil(referenceCards.length / SHEET_WIDTH);

function buildFileUrl(fileName, params = {}) {
  const fileUrl = pathToFileURL(path.join(__dirname, fileName));
  fileUrl.searchParams.set("export", "1");

  for (const [key, value] of Object.entries(params)) {
    fileUrl.searchParams.set(key, String(value));
  }

  return fileUrl.toString();
}

async function renderCardDataUrl(page, card) {
  await page.goto(buildFileUrl(card.file, card.params));
  await page.setViewportSize({ width: SOURCE_CARD_WIDTH, height: SOURCE_CARD_HEIGHT });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

  const buffer = await page.screenshot({
    clip: { x: 0, y: 0, width: SOURCE_CARD_WIDTH, height: SOURCE_CARD_HEIGHT },
    omitBackground: true
  });

  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function buildSheetHtml(cardDataUrls) {
  const cardsMarkup = cardDataUrls.map((card, index) => {
    const column = (index % SHEET_WIDTH) + 1;
    const row = Math.floor(index / SHEET_WIDTH) + 1;

    return `<img class="card" src="${card.dataUrl}" alt="${card.label}" style="grid-column:${column};grid-row:${row};">`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
  }

  #sheet {
    width: ${SHEET_WIDTH * OUTPUT_CARD_WIDTH}px;
    height: ${SHEET_HEIGHT * OUTPUT_CARD_HEIGHT}px;
    display: grid;
    grid-template-columns: repeat(${SHEET_WIDTH}, ${OUTPUT_CARD_WIDTH}px);
    grid-template-rows: repeat(${SHEET_HEIGHT}, ${OUTPUT_CARD_HEIGHT}px);
    gap: 0;
    overflow: hidden;
  }

  .card {
    width: ${OUTPUT_CARD_WIDTH}px;
    height: ${OUTPUT_CARD_HEIGHT}px;
    display: block;
  }
</style>
</head>
<body>
  <div id="sheet">${cardsMarkup}</div>
</body>
</html>`;
}

async function writeManifest() {
  const manifest = {
    name: "Trick Reference Deck",
    importSettings: {
      face: "trick-reference-face-sheet.png",
      uniqueBacks: true,
      back: "trick-reference-back-sheet.png",
      width: SHEET_WIDTH,
      height: SHEET_HEIGHT,
      number: referenceCards.length,
      sideways: false,
      backIsHidden: false
    },
    cardOrder: referenceCards.map((card, index) => ({
      index: index + 1,
      id: card.id,
      label: card.label
    }))
  };

  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function writeReadme() {
  const peoples = referenceCards.filter((card) => card.id !== "rules-card");
  const readme = [
    "# Trick Reference Deck",
    "",
    "Handout cards for the current [rules](../../../../RULES.md): one card per optional people and one",
    "double-sided rules card. Read [peoples conventions](../../../../races/README.md) before use. This deck",
    "is separate from the two standard decks per player, and none of it is needed for core play.",
    "",
    "Files in this folder:",
    `- \`trick-reference-face-sheet.png\`: front card sheet for the full ${referenceCards.length}-card reference deck.`,
    `- \`trick-reference-back-sheet.png\`: back card sheet, the shared timing card behind each people and the rules card's second side.`,
    "- `trick-reference-deck-manifest.json`: exact Tabletop Simulator import settings and card order.",
    "",
    "Import in Tabletop Simulator:",
    "1. Open `Objects > Components > Custom > Deck`.",
    "2. Set Face to the hosted or local path for `trick-reference-face-sheet.png`.",
    "3. Enable `Unique Backs`.",
    "4. Set Back to the hosted or local path for `trick-reference-back-sheet.png`.",
    `5. Set Width to ${SHEET_WIDTH}, Height to ${SHEET_HEIGHT}, and Number to ${referenceCards.length}.`,
    "6. Leave `Sideways` off and leave `Back is Hidden` off, so players can flip a card to read its back.",
    `7. The generated face sheet is ${SHEET_WIDTH * OUTPUT_CARD_WIDTH}x${SHEET_HEIGHT * OUTPUT_CARD_HEIGHT}.`,
    "",
    `Every people's card carries the \`${timingId}\` card on its back, so the timing every ability obeys is always one flip away.`,
    "Deal one people's card to each player and leave the rules card on the table.",
    "",
    "## Printing",
    "",
    `The full-size images in \`../fronts\` and \`../back\` are ${SOURCE_CARD_WIDTH}x${SOURCE_CARD_HEIGHT}, the deck's 1:1.4 ratio.`,
    "At 300 dpi that is 3.5 x 4.9 in. Print the rules card at that size or larger, since it carries the densest text in the set.",
    "",
    ...peoples.map((card) => `- ${card.label}`),
    "- Rules Reference, front and back",
    "",
    "Card order on the sheet is listed in `trick-reference-deck-manifest.json`."
  ].join("\n");

  await writeFile(README_PATH, `${readme}\n`, "utf8");
}

async function main() {
  await mkdir(EXPORT_ROOT, { recursive: true });

  const browser = await chromium.launch();
  const renderPage = await browser.newPage({
    viewport: { width: SOURCE_CARD_WIDTH, height: SOURCE_CARD_HEIGHT },
    deviceScaleFactor: 1
  });
  const sheetPage = await browser.newPage();
  const backPage = await browser.newPage();

  try {
    const cardDataUrls = [];
    for (const card of referenceCards) {
      const dataUrl = await renderCardDataUrl(renderPage, card);
      cardDataUrls.push({ label: card.label, dataUrl });
      console.log(`rendered ${card.id}`);
    }

    await sheetPage.setContent(buildSheetHtml(cardDataUrls));
    await sheetPage.locator("#sheet").screenshot({
      path: FACE_SHEET_PATH,
      omitBackground: true
    });
    console.log(`exported ${path.relative(__dirname, FACE_SHEET_PATH)}`);

    const backDataUrls = [];
    for (const card of referenceCards) {
      const dataUrl = await renderCardDataUrl(renderPage, {
        id: `${card.id}-back`,
        label: `${card.label} Back`,
        file: card.backFile,
        params: card.backParams
      });
      backDataUrls.push({ label: `${card.label} back`, dataUrl });
      console.log(`rendered ${card.id} back`);
    }

    await backPage.setContent(buildSheetHtml(backDataUrls));
    await backPage.locator("#sheet").screenshot({
      path: BACK_SHEET_PATH,
      omitBackground: true
    });
    console.log(`exported ${path.relative(__dirname, BACK_SHEET_PATH)}`);

    await writeManifest();
    console.log(`wrote ${path.relative(__dirname, MANIFEST_PATH)}`);

    await writeReadme();
    console.log(`wrote ${path.relative(__dirname, README_PATH)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
