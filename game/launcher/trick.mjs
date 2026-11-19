// TRICK.exe: double-click to host a game. Built by scripts/build_exe.mjs into one Windows program that carries the
// server, the pages, the card art and cloudflared. On start it unpacks the files it serves (once per version), keeps
// campaigns in Documents\TRICK Campaigns, stops any older host, opens the public tunnel and the host, table and GM windows.
// The console window is the app: it shows the links, and closing it stops the game.
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const say = (...x) => console.log(...x);
process.title = "TRICK host";

// The files packed into the exe: a manifest asset lists them by path.
function unpack() {
  const sea = process.getBuiltinModule("node:sea");
  if (!sea || !sea.isSea()) throw new Error("This launcher runs only as TRICK.exe. Use `npm start` from the repository instead.");
  const manifest = JSON.parse(sea.getAsset("manifest.json", "utf8"));
  const base = join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "TRICK", "app");
  const dir = join(base, manifest.build);
  if (!existsSync(join(dir, ".complete"))) {
    say("Unpacking TRICK (first run of this version)…");
    rmSync(dir, { recursive: true, force: true });
    for (const path of manifest.files) {
      const out = join(dir, path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, new Uint8Array(sea.getAsset(path)));
    }
    writeFileSync(join(dir, ".complete"), manifest.build);
  }
  return { dir, base, manifest };
}

// Older versions' files, once nothing runs from them. A running copy (on another port, say) holds its cloudflared
// open, and Windows won't rename a folder with a running program in it, so a folder in use is left whole.
function removeOldBuilds(base, keep) {
  for (const old of readdirSync(base)) {
    if (old === keep || old.endsWith(".removing")) continue;
    try { renameSync(join(base, old), join(base, `${old}.removing`)); } catch {} // in use: keep it
  }
  for (const old of readdirSync(base)) if (old.endsWith(".removing")) try { rmSync(join(base, old), { recursive: true, force: true }); } catch {}
}

// The Documents folder Windows shows, which may have moved (to OneDrive, say) away from %USERPROFILE%\Documents.
function documentsFolder() {
  try {
    const out = execFileSync("powershell.exe", ["-NoProfile", "-Command", "[Environment]::GetFolderPath('MyDocuments')"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 8000 }).trim();
    if (out && existsSync(out)) return out;
  } catch {}
  const docs = join(homedir(), "Documents");
  return existsSync(docs) ? docs : homedir();
}

// Campaigns live in Documents\TRICK Campaigns, so they survive updates and are easy to find and back up. (A distinct
// name: Windows ignores case, so a plain "TRICK" folder could be someone's own Trick folder, such as this repository.)
// TRICK_SAVES and TRICK_PORT override the folder and port (for testing a build beside a running host).
function savesFolder() {
  const dir = process.env.TRICK_SAVES || join(documentsFolder(), "TRICK Campaigns");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function main() {
  const { dir, base, manifest } = unpack();
  process.env.TRICK_ROOT = dir; // where the server finds its pages (read when it loads, below)
  process.env.CLOUDFLARED = join(dir, "cloudflared.exe");
  const savesDir = savesFolder();
  say(`TRICK ${manifest.version}`);
  say(`Campaigns are saved in ${savesDir}`);
  const { startHost } = await import("../server/start.mjs");
  await startHost({ port: Number(process.env.TRICK_PORT) || 8787, restart: true, tunnel: true, open: true, savesDir });
  removeOldBuilds(base, manifest.build);
  say("\nKeep this window open while you play. Close it to stop the game.");
}

main().catch((e) => {
  say(`\nTRICK couldn't start: ${e && e.message ? e.message : e}`);
  say("Press Enter to close this window.");
  process.stdin.resume();
  process.stdin.once("data", () => process.exit(1));
});
