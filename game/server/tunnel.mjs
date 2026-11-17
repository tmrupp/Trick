// A Cloudflare quick tunnel: a free public https link to this computer, no account needed.
// Needs the cloudflared program installed (Windows: winget install --id Cloudflare.cloudflared).
import { spawn } from "node:child_process";

export function startTunnel(port, { timeoutMs = 45_000 } = {}) {
  return new Promise((ok, fail) => {
    let done = false;
    const child = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", `http://localhost:${port}`], { stdio: ["ignore", "pipe", "pipe"] });
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
    child.on("error", (e) => finish(e.code === "ENOENT"
      ? new Error("cloudflared isn't installed. Install it (Windows: winget install --id Cloudflare.cloudflared), or run without --tunnel.")
      : e));
    child.on("exit", (code) => finish(new Error(`cloudflared stopped (exit ${code}) before giving a link.`)));
    const timer = setTimeout(() => finish(new Error("cloudflared didn't give a link in time.")), timeoutMs);
  });
}
