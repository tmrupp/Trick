// Start the TRICK host: node game/server/main.mjs [--tunnel] [--port 8787] [--saves <dir>]
//   [--restart]            stop an older host on the same port first
//   [--open [campaign-id]] open a campaign (default: the most recently played) and its host, table and GM windows
import { createServer } from "./app.mjs";
import { startTunnel } from "./tunnel.mjs";
import { stopOldHost, waitForPort, openWindows } from "./launch.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.lastIndexOf(name); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback; };
const wantPort = Number(opt("--port", process.env.PORT || 8787));

if (args.includes("--restart")) {
  const old = stopOldHost(wantPort);
  if (old && old.skipped) { console.log(`Port ${wantPort} is held by ${old.name} (process ${old.pid}), not a TRICK host. Stop it or use --port.`); process.exit(1); }
  if (old) console.log(`Stopped the older host (process ${old.pid}).`);
  if (!(await waitForPort(wantPort))) { console.log(`Port ${wantPort} is still busy.`); process.exit(1); }
}

// Cloud hosts set PORT; ADMIN_TOKEN keeps the host link stable across restarts; PUBLIC_URL names the permanent address.
const host = createServer({
  port: wantPort,
  savesDir: opt("--saves", process.env.SAVES_DIR || undefined),
  adminToken: process.env.ADMIN_TOKEN || undefined,
  publicUrl: process.env.PUBLIC_URL || null,
});
const port = await host.listen();
const local = `http://localhost:${port}`;

console.log(`\nTRICK host running on ${local}`);
console.log(`Host page (keep this private): ${local}/host?admin=${host.adminToken}`);

if (args.includes("--tunnel")) {
  console.log("Opening a public tunnel…");
  try {
    const tunnel = await startTunnel(port);
    host.setPublicUrl(tunnel.url);
    console.log(`Public link for players: ${tunnel.url}`);
    const stop = () => { tunnel.stop(); process.exit(0); };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  } catch (e) {
    console.log(`No tunnel: ${e.message}`);
    console.log("Players on this computer's network can still join at its local address.");
  }
} else {
  console.log("Local only. Start with --tunnel to let players join from anywhere.");
}

if (args.includes("--open")) {
  const campaigns = host.store.list();
  const id = opt("--open", campaigns[0] && campaigns[0].id);
  if (!id) {
    console.log("No saved campaign yet: create one on the host page.");
    openWindows([`${local}/host?admin=${host.adminToken}`]);
  } else {
    let room = null;
    try { room = host.openRoom(id); } catch (e) {
      console.log(`Couldn't open campaign "${id}": ${e.message}. Opening the host page instead.`);
    }
    if (!room) openWindows([`${local}/host?admin=${host.adminToken}`]);
    else {
      const gm = `${local}/gm?room=${room.code}&key=${encodeURIComponent(room.save.gmKey)}`;
      console.log(`Opened "${room.save.name}", room ${room.code}.`);
      console.log(`GM page (keep this private): ${gm}`);
      openWindows([`${local}/host?admin=${host.adminToken}`, `${local}/table?room=${room.code}`, gm]);
    }
  }
}
