// Start the TRICK host: node game/server/main.mjs [--tunnel] [--port 8787] [--saves <dir>]
//   [--restart]            stop an older host on the same port first
//   [--open [campaign-id]] open a campaign (default: the most recently played) and its host, table and GM windows
import { startHost } from "./start.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.lastIndexOf(name); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback; };

try {
  // Cloud hosts set PORT; ADMIN_TOKEN keeps the host link stable across restarts; PUBLIC_URL names the permanent address.
  await startHost({
    port: Number(opt("--port", process.env.PORT || 8787)),
    savesDir: opt("--saves", process.env.SAVES_DIR || undefined),
    restart: args.includes("--restart"),
    tunnel: args.includes("--tunnel"),
    open: args.includes("--open") ? opt("--open", true) : false,
    adminToken: process.env.ADMIN_TOKEN || undefined,
    publicUrl: process.env.PUBLIC_URL || null,
  });
} catch (e) {
  console.log(e.message);
  process.exit(1);
}
