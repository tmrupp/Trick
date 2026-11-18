// Start the TRICK host: node game/server/main.mjs [--tunnel] [--port 8787] [--saves <dir>]
import { createServer } from "./app.mjs";
import { startTunnel } from "./tunnel.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; };

// Cloud hosts set PORT; ADMIN_TOKEN keeps the host link stable across restarts; PUBLIC_URL names the permanent address.
const host = createServer({
  port: Number(opt("--port", process.env.PORT || 8787)),
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
