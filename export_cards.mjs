import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { blessedCards, suitCards } from "./card_registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARD_WIDTH = 1050;
const CARD_HEIGHT = 1470;
const EXPORT_ROOT = path.join(__dirname, "exports", "tts");
const FRONT_DIR = path.join(EXPORT_ROOT, "fronts");
const BACK_DIR = path.join(EXPORT_ROOT, "back");

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
  await page.evaluate(() => document.fonts.ready);
  const image = await page.screenshot({
    clip: { x: 0, y: 0, width: CARD_WIDTH, height: CARD_HEIGHT },
    omitBackground: true
  });

  // Another program (an image preview, a sync client) can hold a PNG open for a moment on Windows.
  for (let attempt = 1; ; attempt += 1) {
    try {
      await writeFile(outputPath, image);
      return;
    } catch (error) {
      if (attempt === 5) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
}

async function main() {
  await mkdir(FRONT_DIR, { recursive: true });
  await mkdir(BACK_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CARD_WIDTH, height: CARD_HEIGHT }, deviceScaleFactor: 1 });

  try {
    for (const front of suitCards) {
      for (let value = 1; value <= 10; value += 1) {
        const outputPath = path.join(FRONT_DIR, `${front.suit}-${value}.png`);
        await exportCard(page, front.file, outputPath, { value });
        console.log(`exported ${path.relative(__dirname, outputPath)}`);
      }

      const statusPath = path.join(FRONT_DIR, `${front.statusName}.png`);
      await exportCard(page, front.statusFile, statusPath);
      console.log(`exported ${path.relative(__dirname, statusPath)}`);
    }

    // Both Blessed copies share one face.
    const blessedPath = path.join(FRONT_DIR, "blessed.png");
    await exportCard(page, blessedCards[0].file, blessedPath);
    console.log(`exported ${path.relative(__dirname, blessedPath)}`);

    const backPath = path.join(BACK_DIR, "card-back.png");
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
