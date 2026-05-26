import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { buildItemDeckCards } from "./item_registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_CARD_WIDTH = 1050;
const SOURCE_CARD_HEIGHT = 1470;
const OUTPUT_CARD_WIDTH = 400;
const OUTPUT_CARD_HEIGHT = 560;
const SHEET_WIDTH = 4;
const EXPORT_ROOT = path.join(__dirname, "exports", "tts", "items", "deck");
const FACE_SHEET_PATH = path.join(EXPORT_ROOT, "trick-item-face-sheet.png");
const BACK_IMAGE_PATH = path.join(EXPORT_ROOT, "trick-item-card-back.png");
const MANIFEST_PATH = path.join(EXPORT_ROOT, "trick-item-deck-manifest.json");
const README_PATH = path.join(EXPORT_ROOT, "README.md");

const itemCards = buildItemDeckCards();
const SHEET_HEIGHT = Math.ceil(itemCards.length / SHEET_WIDTH);

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

function buildSingleCardHtml(dataUrl) {
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

  img {
    width: ${OUTPUT_CARD_WIDTH}px;
    height: ${OUTPUT_CARD_HEIGHT}px;
    display: block;
  }
</style>
</head>
<body>
  <img src="${dataUrl}" alt="Card back">
</body>
</html>`;
}

async function writeManifest() {
  const manifest = {
    name: "Trick Item Deck",
    importSettings: {
      face: "trick-item-face-sheet.png",
      uniqueBacks: false,
      back: "trick-item-card-back.png",
      width: SHEET_WIDTH,
      height: SHEET_HEIGHT,
      number: itemCards.length,
      sideways: false,
      backIsHidden: true
    },
    cardOrder: itemCards.map((card, index) => ({
      index: index + 1,
      id: card.id,
      label: card.label
    }))
  };

  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function writeReadme() {
  const readme = [
    "# Trick Item Deck",
    "",
    "Files in this folder:",
    `- \`trick-item-face-sheet.png\`: front card sheet for the full ${itemCards.length}-card item deck.`,
    "- `trick-item-card-back.png`: shared back image.",
    "- `trick-item-deck-manifest.json`: exact Tabletop Simulator import settings and card order.",
    "",
    "Import in Tabletop Simulator:",
    "1. Open `Objects > Components > Custom > Deck`.",
    "2. Set Face to the hosted or local path for `trick-item-face-sheet.png`.",
    "3. Leave `Unique Backs` disabled.",
    "4. Set Back to the hosted or local path for `trick-item-card-back.png`.",
    `5. Set Width to ${SHEET_WIDTH}, Height to ${SHEET_HEIGHT}, and Number to ${itemCards.length}.`,
    "6. Leave `Sideways` off and enable `Back is Hidden`.",
    `7. The generated face sheet is ${SHEET_WIDTH * OUTPUT_CARD_WIDTH}x${SHEET_HEIGHT * OUTPUT_CARD_HEIGHT}.`,
    "",
    "Card order on the sheet is listed in `trick-item-deck-manifest.json`."
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
    for (const card of itemCards) {
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

    const backDataUrl = await renderCardDataUrl(renderPage, {
      id: "item-card-back",
      label: "Item Card Back",
      file: "card_back.html",
      params: {}
    });
    await backPage.setContent(buildSingleCardHtml(backDataUrl));
    await backPage.locator("img").screenshot({
      path: BACK_IMAGE_PATH,
      omitBackground: true
    });
    console.log(`exported ${path.relative(__dirname, BACK_IMAGE_PATH)}`);

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
