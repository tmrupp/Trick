// Where campaigns are saved, for every way of starting a host (npm start and TRICK.exe): one folder, so they all
// share the same campaigns. On Windows that's Documents\TRICK Campaigns, wherever Windows keeps Documents (OneDrive
// included, which also carries it to your other computers). SAVES_DIR (or TRICK_SAVES) overrides it; the Docker image
// sets SAVES_DIR=/data. (A distinct name: Windows ignores case, so a plain "TRICK" folder could be someone's own Trick
// folder, such as this repository.)
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

// The Documents folder Windows shows, which may have moved (to OneDrive, say) away from %USERPROFILE%\Documents.
function documentsFolder() {
  if (process.platform === "win32") {
    try {
      const out = execFileSync("powershell.exe", ["-NoProfile", "-Command", "[Environment]::GetFolderPath('MyDocuments')"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 8000 }).trim();
      if (out && existsSync(out)) return out;
    } catch {}
  }
  const docs = join(homedir(), "Documents");
  return existsSync(docs) ? docs : homedir();
}

export function savesFolder() {
  const dir = resolve(process.env.SAVES_DIR || process.env.TRICK_SAVES || join(documentsFolder(), "TRICK Campaigns"));
  mkdirSync(dir, { recursive: true });
  return dir;
}

// Campaigns in an older folder (such as the repository's game/saves, used before) that aren't in this one.
export function leftBehind(oldDir, dir) {
  if (!existsSync(oldDir) || resolve(oldDir) === resolve(dir)) return [];
  const here = new Set(existsSync(dir) ? readdirSync(dir) : []);
  return readdirSync(oldDir).filter((f) => f.endsWith(".json") && !here.has(f));
}
