// A Cloudflare quick tunnel: a free public https link to this computer, no account needed.
// Needs the cloudflared program (Windows: winget install --id Cloudflare.cloudflared). It is found on the PATH,
// at CLOUDFLARED (a full path), or where the Windows installer puts it.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

function candidates() {
  const list = [];
  if (process.env.CLOUDFLARED) list.push(process.env.CLOUDFLARED);
  list.push("cloudflared");
  if (process.platform === "win32") {
    for (const dir of [process.env["ProgramFiles(x86)"], process.env.ProgramFiles, "C:\\Program Files (x86)", "C:\\Program Files"]) {
      if (dir) list.push(`${dir}\\cloudflared\\cloudflared.exe`);
    }
  }
  return [...new Set(list)].filter((c) => c === "cloudflared" || existsSync(c));
}

function tryStart(bin, port, timeoutMs) {
  return new Promise((ok, fail) => {
    let done = false;
    const child = spawn(bin, ["tunnel", "--no-autoupdate", "--url", `http://localhost:${port}`], { stdio: ["ignore", "pipe", "pipe"] });
    const finish = (err, url) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (err) { child.kill(); fail(err); } else ok({ url, stop: () => child.kill() });
    };
    const scan = (chunk) => {
      const m = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m) finish(null, m[0]);
    };
    child.stdout.on("data", scan);
    child.stderr.on("data", scan);
    child.on("error", (e) => finish(e));
    child.on("exit", (code) => finish(new Error(`cloudflared stopped (exit ${code}) before giving a link.`)));
    const timer = setTimeout(() => finish(new Error("cloudflared didn't give a link in time.")), timeoutMs);
  });
}

export async function startTunnel(port, { timeoutMs = 45_000 } = {}) {
  for (const bin of candidates()) {
    try {
      return await tryStart(bin, port, timeoutMs);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  throw new Error("cloudflared isn't installed. Install it (Windows: winget install --id Cloudflare.cloudflared), or run without --tunnel.");
}
