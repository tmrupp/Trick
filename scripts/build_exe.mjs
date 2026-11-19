// Build dist/TRICK.exe: one Windows program that hosts a game when double-clicked (see game/launcher/trick.mjs).
//   npm run build:exe
// It is Node's single executable application: the launcher and server are bundled into one script (esbuild), the
// files the server serves plus cloudflared are packed in as assets, and both are injected into a copy of node.exe.
// cloudflared comes from CLOUDFLARED, the PATH, or where its Windows installer puts it.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import rcedit from "rcedit";

if (process.platform !== "win32") { console.log("TRICK.exe is built on Windows."); process.exit(1); }
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(REPO, "dist");
const WORK = join(OUT, "build");
const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
const version = pkg.version || "1.0.0";

// The files the server reads from disk: the same list as the Dockerfile.
const SERVED = ["game/public", "game/engine", "suit_icons.js", "card_rules.js", "rules.html", "items/item_catalog.js", "races/race_catalog.js", "exports/web"];
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => walk(join(p, f))) : [p]);
const files = SERVED.flatMap((p) => walk(join(REPO, p))).map((f) => relative(REPO, f).replaceAll("\\", "/"));

function findCloudflared() {
  const tries = [process.env.CLOUDFLARED, "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe", "C:\\Program Files\\cloudflared\\cloudflared.exe"].filter(Boolean);
  try { tries.push(...execFileSync("where.exe", ["cloudflared"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean)); } catch {}
  const found = tries.find((p) => existsSync(p));
  if (!found) throw new Error("cloudflared not found. Install it (winget install --id Cloudflare.cloudflared) or set CLOUDFLARED.");
  return found;
}

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

// 1. One CommonJS script: the launcher, the server and the engine. ws's optional native helpers stay out.
console.log("Bundling…");
await build({
  entryPoints: [join(REPO, "game/launcher/trick.mjs")], bundle: true, platform: "node", target: "node22", format: "cjs",
  outfile: join(WORK, "trick.cjs"), external: ["bufferutil", "utf-8-validate"], logLevel: "warning",
  logOverride: { "empty-import-meta": "silent" }, // the packaged server finds its files through TRICK_ROOT instead
});

// 2. The assets: every served file, cloudflared, and a manifest naming them with a build id from their contents.
const cloudflared = findCloudflared();
const hash = createHash("sha256");
for (const f of files) hash.update(f).update(readFileSync(join(REPO, f)));
hash.update(readFileSync(join(WORK, "trick.cjs"))).update(readFileSync(cloudflared));
const buildId = `${version}-${hash.digest("hex").slice(0, 12)}`;
const assets = Object.fromEntries(files.map((f) => [f, join(REPO, f)]));
assets["cloudflared.exe"] = cloudflared;
writeFileSync(join(WORK, "manifest.json"), JSON.stringify({ version, build: buildId, files: [...files, "cloudflared.exe"] }));
assets["manifest.json"] = join(WORK, "manifest.json");

// 3. The blob Node injects, then a copy of node.exe with TRICK's icon and name, then the injection.
writeFileSync(join(WORK, "sea-config.json"), JSON.stringify({ main: join(WORK, "trick.cjs"), output: join(WORK, "sea.blob"), disableExperimentalSEAWarning: true, assets }));
console.log("Packing", files.length + 1, "files…");
execFileSync(process.execPath, ["--experimental-sea-config", join(WORK, "sea-config.json")], { stdio: "inherit" });
const exe = join(OUT, "TRICK.exe");
rmSync(exe, { force: true });
copyFileSync(process.execPath, exe);
await rcedit(exe, {
  icon: join(REPO, "game/launcher/trick.ico"),
  "version-string": { ProductName: "TRICK", FileDescription: "TRICK host", CompanyName: "TRICK", OriginalFilename: "TRICK.exe", InternalName: "TRICK" },
  "file-version": version, "product-version": version,
});
execFileSync(process.execPath, [join(REPO, "node_modules/postject/dist/cli.js"), exe, "NODE_SEA_BLOB", join(WORK, "sea.blob"),
  "--sentinel-fuse", "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"], { stdio: ["ignore", "ignore", "inherit"] });
rmSync(WORK, { recursive: true, force: true });
console.log(`Built ${relative(REPO, exe)} (${(statSync(exe).size / 1e6).toFixed(0)} MB), build ${buildId}.`);
