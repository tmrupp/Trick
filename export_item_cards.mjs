import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { buildItemDeckCards } from "./item_registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARD_WIDTH = 1050;
const CARD_HEIGHT = 1470;
const EXPORT_ROOT = path.join(__dirname, "exports", "tts", "items");
const FRONT_DIR = path.join(EXPORT_ROOT, "fronts");
const BACK_DIR = path.join(EXPORT_ROOT, "back");

const itemCards = buildItemDeckCards();

function buildFileUrl(fileName, params = {}) {
  const fileUrl = pathToFileURL(path.join(__dirname, fileName));
  for (const [key, value] of Object.entries(params)) {
    fileUrl.searchParams.set(key, String(value));
  }
  return fileUrl.toString();
}

async function exportCard(page, fileName, outputPath, params = {}) {
  await page.goto(buildFileUrl(fileName, { export: 1, ...params }));
  await page.setViewportSize({ width: CARD_WIDTH, height: CARD_HEIGHT });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
  await page.screenshot({
    path: outputPath,
    clip: { x: 0, y: 0, width: CARD_WIDTH, height: CARD_HEIGHT },
    omitBackground: true
  });
}

async function main() {
  await mkdir(FRONT_DIR, { recursive: true });
  await mkdir(BACK_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CARD_WIDTH, height: CARD_HEIGHT }, deviceScaleFactor: 1 });

  try {
    for (const card of itemCards) {
      const outputPath = path.join(FRONT_DIR, `${card.id}.png`);
      await exportCard(page, card.file, outputPath, card.params);
      console.log(`exported ${path.relative(__dirname, outputPath)}`);

      const backOutputPath = path.join(BACK_DIR, `${card.id}-back.png`);
      await exportCard(page, card.backFile, backOutputPath, card.backParams);
      console.log(`exported ${path.relative(__dirname, backOutputPath)}`);
    }

    const backPath = path.join(BACK_DIR, "item-card-back.png");
    await exportCard(page, "card_back.html", backPath);
    console.log(`exported ${path.relative(__dirname, backPath)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
