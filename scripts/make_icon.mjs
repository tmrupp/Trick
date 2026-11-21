// Draw TRICK's app icon and write game/launcher/trick.ico (PNG images at 16–256 px, which Windows reads directly).
// Run once after changing the design: node scripts/make_icon.mjs. The build (scripts/build_exe.mjs) uses the .ico.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const SIZES = [256, 64, 48, 32, 24, 16];
// The Swiss Grid look: the accent red, a heavy white T, and a black bar like the screens' banners.
const page = (s) => `<!doctype html><html><body style="margin:0;background:transparent">
<div style="width:${s}px;height:${s}px;background:#d7261e;position:relative;overflow:hidden;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif">
  <div style="position:absolute;left:0;right:0;top:0;height:${Math.max(2, Math.round(s * 0.09))}px;background:#111"></div>
  <div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-weight:900;font-size:${Math.round(s * 0.82)}px;line-height:1;padding-top:${Math.round(s * 0.08)}px;letter-spacing:-.04em">T</div>
</div></body></html>`;

const browser = await chromium.launch();
const pngs = [];
for (const s of SIZES) {
  const p = await browser.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
  await p.setContent(page(s));
  pngs.push(await p.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } }));
}
await browser.close();

// ICO: a header, one directory entry per image, then the PNGs.
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
const dir = Buffer.alloc(16 * pngs.length);
let offset = 6 + dir.length;
pngs.forEach((png, i) => {
  const s = SIZES[i], e = i * 16;
  dir.writeUInt8(s >= 256 ? 0 : s, e); dir.writeUInt8(s >= 256 ? 0 : s, e + 1);
  dir.writeUInt16LE(1, e + 4); dir.writeUInt16LE(32, e + 6);
  dir.writeUInt32LE(png.length, e + 8); dir.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
writeFileSync(new URL("../game/launcher/trick.ico", import.meta.url), Buffer.concat([head, dir, ...pngs]));
writeFileSync(new URL("../game/launcher/trick-256.png", import.meta.url), pngs[0]);
console.log("Wrote game/launcher/trick.ico");
