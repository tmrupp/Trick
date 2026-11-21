// Start a TRICK host: the server, optionally a public tunnel, and optionally the host, table and GM windows.
// One path for every way of starting it: `npm start` (main.mjs) and the packaged TRICK.exe (game/launcher).
import { createServer } from "./app.mjs";
import { startTunnel } from "./tunnel.mjs";
import { stopOldHost, waitForPort, openWindows } from "./launch.mjs";
import { savesFolder, leftBehind } from "./saves_dir.mjs";
import { fileURLToPath } from "node:url";

// port: where to listen. savesDir: where campaigns are kept (default: the shared folder, see saves_dir.mjs). restart: stop an older host on the port first.
// tunnel: open a public link. open: true for the most recent campaign, or a campaign id; opens its windows.
export async function startHost({ port: wantPort = 8787, savesDir, restart = false, tunnel = false, open = false, adminToken, publicUrl = null, log = console.log } = {}) {
  if (restart) {
    const old = stopOldHost(wantPort);
    if (old && old.skipped) throw new Error(`Port ${wantPort} is held by ${old.name} (process ${old.pid}), not a TRICK host. Stop it or use another port.`);
    if (old) log(`Stopped the older host (process ${old.pid}).`);
    if (!(await waitForPort(wantPort))) throw new Error(`Port ${wantPort} is still busy.`);
  }

  savesDir = savesDir || savesFolder();
  const host = createServer({ port: wantPort, savesDir, adminToken, publicUrl });
  const port = await host.listen();
  const local = `http://localhost:${port}`;
  const hostPage = `${local}/host?admin=${host.adminToken}`;
  log(`\nTRICK host running on ${local}`);
  log(`Campaigns are saved in ${savesDir}`);
  // Campaigns from before every host shared one folder, when npm start kept them in the repository.
  if (!process.env.TRICK_ROOT) {
    const behind = leftBehind(fileURLToPath(new URL("../saves", import.meta.url)), savesDir);
    if (behind.length) log(`Still in game/saves, not shared: ${behind.join(", ")}. Copy any you want to keep playing.`);
  }
  log(`Host page (keep this private): ${hostPage}`);

  let stopTunnel = () => {};
  if (tunnel) {
    log("Opening a public tunnel…");
    try {
      const t = await startTunnel(port);
      stopTunnel = t.stop;
      host.setPublicUrl(t.url);
      log(`Public link for players: ${t.url}`);
    } catch (e) {
      log(`No tunnel: ${e.message}`);
      log("Players on this computer's network can still join at its local address.");
    }
  } else {
    log("Local only. Start with a tunnel to let players join from anywhere.");
  }
  const stop = () => { stopTunnel(); process.exit(0); };
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, stop); // SIGHUP: the console window closing

  if (open) {
    const campaigns = host.store.list();
    const id = open === true ? campaigns[0] && campaigns[0].id : open;
    let room = null;
    if (!id) log("No saved campaign yet: create one on the host page.");
    else {
      try { room = host.openRoom(id); } catch (e) { log(`Couldn't open campaign "${id}": ${e.message}. Opening the host page instead.`); }
    }
    if (!room) openWindows([hostPage]);
    else {
      const gm = `${local}/gm?room=${room.code}&key=${encodeURIComponent(room.save.gmKey)}`;
      log(`Opened "${room.save.name}", room ${room.code}.`);
      log(`GM page (keep this private): ${gm}`);
      openWindows([hostPage, `${local}/table?room=${room.code}`, gm]);
    }
  }
  return { host, port, local, hostPage, stop };
}
