// Helpers for `npm run restart`: stop an older host on the same port, and open the host, table and GM pages.
import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const run = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return ""; } };

// Stop the Node process listening on this port, with its tunnel. Anything that isn't Node is left alone.
export function stopOldHost(port) {
  if (process.platform === "win32") {
    const ps = `$c = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; if ($p) { "$($p.Id) $($p.ProcessName)" } }`;
    const [pid, name] = run("powershell.exe", ["-NoProfile", "-Command", ps]).trim().split(/\s+/);
    if (!pid) return null;
    if (name !== "node") return { pid, name, skipped: true };
    run("taskkill", ["/PID", pid, "/T", "/F"]); // /T takes the cloudflared child with it
    return { pid, name };
  }
  const pid = run("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"]).trim().split("\n")[0];
  if (!pid) return null;
  const name = run("ps", ["-p", pid, "-o", "comm="]).trim();
  if (!/node/.test(name)) return { pid, name, skipped: true };
  run("pkill", ["-TERM", "-P", pid]);
  run("kill", ["-TERM", pid]);
  return { pid, name };
}

// Wait until the port is free, so the new host can bind it.
export async function waitForPort(port, ms = 5000) {
  const net = await import("node:net");
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const free = await new Promise((ok) => { const s = net.createServer().once("error", () => ok(false)).once("listening", () => s.close(() => ok(true))).listen(port); });
    if (free) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

// Open the URLs as tabs of one new browser window: Chrome or Edge if installed, else the default browser.
// TRICK_NO_BROWSER=1 prints the links instead.
export function openWindows(urls) {
  if (process.env.TRICK_NO_BROWSER) { for (const url of urls) console.log(`(would open) ${url}`); return; }
  const pf = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean);
  const chromium = process.platform === "win32"
    ? pf.flatMap((d) => [join(d, "Google", "Chrome", "Application", "chrome.exe"), join(d, "Microsoft", "Edge", "Application", "msedge.exe")]).find(existsSync)
    : null;
  // One new window with every page as a tab.
  if (chromium) return void spawn(chromium, ["--new-window", ...urls], { detached: true, stdio: "ignore" }).unref();
  for (const url of urls) {
    if (process.platform === "win32") spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    else spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}
