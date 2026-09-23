import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileRetry } from "./export_util.mjs";
import { chromium } from "playwright";

// Lays every exported card onto a square print page, positioned where the blank card
// physically sits in the printer. print_layout.json holds the page size, the card's box on
// the page as read off the calibration print, and how the card is turned, so the card
// image fills exactly the card.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const layout = JSON.parse(await readFile(path.join(__dirname, "print_layout.json"), "utf8"));
const DPI = 300;
const CSS_PX_PER_MM = 96 / 25.4;
const SOURCES = ["exports/tts/fronts", "exports/tts/back", "exports/tts/items/fronts", "exports/tts/items/back",
  "exports/tts/reference/fronts", "exports/tts/reference/back"];

const { pageMm, rotate = "none", cardOnPageMm: box } = layout;
// A card turned a quarter-turn puts its height along the page's width.
const turned = rotate === "cw" || rotate === "ccw";
const cardWidthMm = turned ? box.bottom - box.top : box.right - box.left;
const cardHeightMm = turned ? box.right - box.left : box.bottom - box.top;
const degrees = { none: 0, cw: 90, ccw: -90, flip: 180 }[rotate];
if (degrees === undefined) throw new Error(`print_layout.json rotate must be none, cw, ccw, or flip, not ${rotate}`);
const pageCss = pageMm * CSS_PX_PER_MM;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: Math.ceil(pageCss), height: Math.ceil(pageCss) }, deviceScaleFactor: DPI / 96 });
  let count = 0;
  try {
    for (const source of SOURCES) {
      const outDir = path.join(__dirname, "exports", "print", path.relative("exports/tts", source));
      await mkdir(outDir, { recursive: true });
      for (const file of (await readdir(path.join(__dirname, source))).filter((name) => name.endsWith(".png"))) {
        // setContent pages cannot load file:// images, so embed the card.
        const src = `data:image/png;base64,${(await readFile(path.join(__dirname, source, file))).toString("base64")}`;
        await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
          <div style="position:relative;width:${pageMm}mm;height:${pageMm}mm;overflow:hidden">
            <img src="${src}" style="position:absolute;left:${(box.left + box.right) / 2}mm;top:${(box.top + box.bottom) / 2}mm;width:${cardWidthMm}mm;height:${cardHeightMm}mm;transform:translate(-50%,-50%) rotate(${degrees}deg)">
          </div></body></html>`);
        await page.waitForFunction(() => document.images[0].complete);
        await writeFileRetry(path.join(outDir, file), await page.screenshot({ clip: { x: 0, y: 0, width: pageCss, height: pageCss } }));
        count += 1;
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`wrote ${count} print pages (${pageMm} x ${pageMm} mm at ${DPI} dpi) under exports/print`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
