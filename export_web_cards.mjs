// Small card images for the game's web pages, in light and dark: exports/web/{light,dark}/<card>.png.
// Rendered from the same card pages as the print and TTS exports, at a third of their size.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { writeFileRetry } from "./export_util.mjs";
import { blessedCards, suitCards } from "./card_registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 1050, H = 1470, SCALE = 1 / 3;

function url(file, params) {
  const u = pathToFileURL(path.join(__dirname, file));
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return u.toString();
}

const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const dir = path.join(__dirname, "exports", "web", theme);
    await mkdir(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
    const shot = async (file, name, params = {}) => {
      await page.goto(url(file, { export: 1, ...(theme === "dark" ? { theme: "dark" } : {}), ...params }));
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await writeFileRetry(path.join(dir, `${name}.png`), await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, omitBackground: true }));
    };
    let n = 0;
    for (const s of suitCards) {
      for (let v = 1; v <= 10; v++) { await shot(s.file, `${s.suit}-${v}`, { value: v }); n++; }
      await shot(s.statusFile, s.statusName); n++;
    }
    await shot(blessedCards[0].file, "blessed"); n++;
    await shot("card_back.html", "back"); n++;
    await page.close();
    console.log(`wrote ${n} ${theme} cards to exports/web/${theme}`);
  }
} finally {
  await browser.close();
}
