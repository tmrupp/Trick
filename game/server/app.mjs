// The host server: pages, a small admin API for the host computer, and one WebSocket per screen.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import QRCode from "qrcode";
import { RuleError } from "../engine/index.mjs";
import { Store, newSecret } from "./store.mjs";
import { Room } from "./room.mjs";
import { loadItemCatalog } from "./items.mjs";
import { savesFolder } from "./saves_dir.mjs";

// The repository's files the host serves. The packaged TRICK.exe unpacks them somewhere else and says where in TRICK_ROOT.
const REPO = process.env.TRICK_ROOT ? resolve(process.env.TRICK_ROOT) : resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const PUBLIC = resolve(REPO, "game", "public");
const SHARED_FROM_REPO = new Map([ // repo files the pages may load
  ["/suit_icons.js", "suit_icons.js"], ["/card_rules.js", "card_rules.js"],
  ["/races/race_catalog.js", "races/race_catalog.js"],
  ["/rules", "rules.html"],
]);

// The item catalog goes out without its Relic Price text, which only viewFor sends (game/server/items.mjs).
const ITEMS = loadItemCatalog(REPO);

const TYPES = { ".png": "image/png", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };
const PAGES = { "/host": "host.html", "/table": "table.html", "/watch": "table.html", "/play": "play.html", "/gm": "gm.html", "/print": "print.html" };

export function createServer({ port = 8787, savesDir = savesFolder(), adminToken = newSecret(), publicUrl = null, log = console.log, botDelay = 650 } = {}) {
  let base = publicUrl;
  const linkBase = () => base || `http://localhost:${port}`;
  const store = new Store(savesDir);
  const rooms = new Map(); // code -> Room
  const joinsByIp = new Map(); // ip -> [timestamps]
  // Campaigns the host closed: screens that reconnect (a table tab, a phone waking up) are turned away instead of
  // reopening them. Opening one again from the host page clears it; a restarted host starts with none closed.
  const closed = new Set(); // campaign ids
  const CLOSED = "The host closed this campaign. It opens again from the host page.";

  const openRoom = (id) => {
    const save = store.read(id);
    closed.delete(save.id);
    if (!rooms.has(save.code)) rooms.set(save.code, new Room(save, store, linkBase, { botDelay, itemPrices: ITEMS.prices }));
    return rooms.get(save.code);
  };

  // A room by code, opening its saved campaign if the host hasn't yet (e.g. just after a restart), unless the host closed it.
  const savedByCode = (code) => store.list().find((c) => c.code === String(code || "").toUpperCase());
  const isClosed = (code) => { const saved = savedByCode(code); return !!saved && closed.has(saved.id); };
  const roomByCode = (code) => {
    code = String(code || "").toUpperCase();
    if (rooms.has(code)) return rooms.get(code);
    const saved = savedByCode(code);
    return saved && !closed.has(saved.id) ? openRoom(saved.id) : null;
  };

  const info = () => ({
    publicUrl: linkBase(),
    rooms: [...rooms.values()].map((r) => ({ id: r.save.id, name: r.save.name, code: r.code, gmKey: r.save.gmKey, seats: r.roomInfo(null).seats })),
    campaigns: store.list(),
  });

  const send = (res, status, body, type = "application/json") => {
    res.writeHead(status, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
    res.end(type === "application/json" ? JSON.stringify(body) : body);
  };

  const readJson = (req, limit = 5 * 1024 * 1024) => new Promise((ok, fail) => {
    let data = "";
    req.on("data", (d) => { data += d; if (data.length > limit) { const err = new Error("Request body is too large."); err.status = 413; fail(err); req.destroy(); } });
    req.on("error", fail);
    req.on("end", () => { try { ok(data ? JSON.parse(data) : {}); } catch (e) { e.status = 400; fail(e); } });
  });

  async function serveFile(res, file, cache) {
    try {
      const body = await readFile(file);
      if (cache) { res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": cache }); return res.end(body); }
      send(res, 200, body, TYPES[extname(file)] || "application/octet-stream");
    } catch {
      send(res, 404, { error: "Not found" });
    }
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://x");
      const path = url.pathname;
      if (path === "/" ) { res.writeHead(302, { location: "/play" }); return res.end(); }
      if (PAGES[path]) return serveFile(res, join(PUBLIC, PAGES[path]));
      if (path.startsWith("/j/")) { res.writeHead(302, { location: `/play?room=${encodeURIComponent(path.slice(3).toUpperCase())}` }); return res.end(); }
      if (path.startsWith("/shared/")) {
        const file = normalize(join(PUBLIC, path));
        if (!file.startsWith(PUBLIC + sep)) return send(res, 404, { error: "Not found" });
        return serveFile(res, file);
      }
      if (path === "/items/item_catalog.js") return send(res, 200, ITEMS.script, "text/javascript; charset=utf-8");
      if (SHARED_FROM_REPO.has(path)) return serveFile(res, join(REPO, SHARED_FROM_REPO.get(path)));
      // The engine's modules, so the pages share its rules and constants instead of copying them.
      if (/^\/engine\/[a-z_]+\.mjs$/.test(path)) return serveFile(res, join(REPO, "game", "engine", path.slice("/engine/".length)));
      // Card art at web size, light and dark, from npm run export:web-cards.
      if (/^\/cards\/(light|dark)\/[a-z0-9-]+\.png$/.test(path)) return serveFile(res, join(REPO, "exports", "web", path.slice("/cards/".length)), "public, max-age=86400");
      if (path === "/qr.svg") {
        const text = String(url.searchParams.get("text") || "").slice(0, 300);
        if (!/^https?:\/\//.test(text)) return send(res, 400, { error: "Give a link." });
        return send(res, 200, await QRCode.toString(text, { type: "svg", margin: 1 }), TYPES[".svg"]);
      }
      // Characters a returning player can take back. Names only; no tokens or hands.
      const back = path.match(/^\/api\/rooms\/([A-Za-z]{1,8})\/returning$/);
      if (back && req.method === "GET") {
        const room = roomByCode(back[1]);
        if (!room && isClosed(back[1])) return send(res, 404, { error: CLOSED });
        return room ? send(res, 200, { code: room.code, returning: room.returning() }) : send(res, 404, { error: "No room with that code." });
      }
      if (path.startsWith("/api/")) {
        if (req.headers["x-admin"] !== adminToken) return send(res, 403, { error: "This page needs the host's admin link." });
        if (path === "/api/info" && req.method === "GET") return send(res, 200, info());
        if (path === "/api/campaigns" && req.method === "POST") {
          const body = await readJson(req);
          const save = store.create({ name: String(body.name || "").slice(0, 60), seed: body.seed, takenCodes: new Set(rooms.keys()) });
          openRoom(save.id);
          return send(res, 200, info());
        }
        if (path === "/api/open" && req.method === "POST") {
          const body = await readJson(req);
          openRoom(String(body.id));
          return send(res, 200, info());
        }
        // Download a campaign's save, to keep or move to another host.
        if (path === "/api/export" && req.method === "GET") {
          const id = String(url.searchParams.get("id") || "");
          const save = store.read(id);
          const { gmKey, ...shareable } = save; // the GM key stays on this host
          return send(res, 200, shareable);
        }
        // Import a downloaded save as a new campaign (new id, room code and GM key; seats keep their tokens).
        if (path === "/api/import" && req.method === "POST") {
          const body = await readJson(req);
          let save;
          try { save = store.importSave(body, new Set(rooms.keys())); } catch (e) { return send(res, 400, { error: e.message }); }
          try { openRoom(save.id); } catch (e) { store.archive(save.id); return send(res, 400, { error: `That save doesn't replay: ${e.message}` }); }
          return send(res, 200, info());
        }
        // Archive: close the room and move the save out of the list.
        // Close an open campaign: its screens disconnect and the room unloads; the save stays where it is.
        if (path === "/api/close" && req.method === "POST") {
          const body = await readJson(req);
          const id = String(body.id);
          let wasOpen = false;
          for (const [code, r] of rooms) if (r.save.id === id) { closed.add(id); for (const c of r.clients) { c.send({ type: "closed", reason: CLOSED }); c.close(); } r.stop(); rooms.delete(code); wasOpen = true; }
          if (!wasOpen) return send(res, 400, { error: "That campaign isn't open." });
          return send(res, 200, info());
        }
        if (path === "/api/archive" && req.method === "POST") {
          const body = await readJson(req);
          const id = String(body.id);
          for (const [code, r] of rooms) if (r.save.id === id) { for (const c of r.clients) { c.send({ type: "closed", reason: "The host archived this campaign." }); c.close(); } r.stop(); rooms.delete(code); }
          store.archive(id);
          return send(res, 200, info());
        }
        return send(res, 404, { error: "Unknown API." });
      }
      send(res, 404, { error: "Not found" });
    } catch (e) {
      if (e.status) return send(res, e.status, { error: e.message });
      log("request error:", e.message);
      send(res, 500, { error: "Server error" });
    }
  });

  // ---- WebSockets ----
  const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 64 * 1024 });

  const clientIp = (req) => String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

  const allowJoin = (ip) => {
    const now = Date.now();
    const recent = (joinsByIp.get(ip) || []).filter((t) => now - t < 60_000);
    recent.push(now);
    joinsByIp.set(ip, recent);
    return recent.length <= 20;
  };

  wss.on("connection", (ws, req) => {
    const ip = clientIp(req);
    let client = null;
    let room = null;
    let bucket = { tokens: 20, at: Date.now() };
    const reply = (msg) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg)); };
    const helloTimer = setTimeout(() => { if (!client) ws.close(4000, "No hello"); }, 10_000);
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("message", (raw) => {
      // A small token bucket: about 10 messages a second, bursts of 20.
      const now = Date.now();
      bucket.tokens = Math.min(20, bucket.tokens + ((now - bucket.at) / 1000) * 10);
      bucket.at = now;
      if (bucket.tokens < 1) return reply({ type: "error", reason: "Slow down." });
      bucket.tokens--;
      let msg;
      try { msg = JSON.parse(raw); } catch { return reply({ type: "error", reason: "Bad message." }); }
      try {
        if (msg.type === "hello") {
          if (client) return reply({ type: "error", reason: "Already joined." });
          if (!allowJoin(ip)) return reply({ type: "error", reason: "Too many joins from here; wait a minute." });
          room = roomByCode(msg.room);
          if (!room && isClosed(msg.room)) return reply({ type: "closed", reason: CLOSED });
          if (!room) return reply({ type: "error", reason: "No room with that code." });
          const as = ["table", "gm", "player"].includes(msg.as) ? msg.as : "player";
          const seat = room.join({ as, token: msg.token, name: msg.name, gmKey: msg.gmKey, reclaim: msg.reclaim, claimIfFree: !!msg.claimIfFree });
          clearTimeout(helloTimer);
          client = { seat, as, send: reply, close: () => ws.close(4001, "Removed") };
          room.clients.add(client);
          reply({ type: "welcome", token: seat ? seat.token : null, seatId: seat ? seat.id : null, role: seat ? seat.role : "table" });
          reply({ type: "notes", notes: room.notesFor(seat), all: true });
          room.broadcast([{ type: "connected", seatId: seat ? seat.id : null }]);
          return;
        }
        if (!client) return reply({ type: "error", reason: "Join a room first." });
        if (msg.type === "action") {
          room.act(client.seat, msg.action);
          return reply({ type: "ok", seq: msg.seq });
        }
        if (msg.type === "manage") {
          // Some seat operations finish later (a doc import fetches from Google).
          const done = room.manage(client.seat, msg);
          if (done && typeof done.then === "function") {
            done.then(() => reply({ type: "ok", seq: msg.seq }), (e) => reply({ type: "rejected", seq: msg.seq, reason: e instanceof RuleError ? e.message : "Something went wrong on the host." }));
            return;
          }
          return reply({ type: "ok", seq: msg.seq });
        }
        reply({ type: "error", reason: "Unknown message." });
      } catch (e) {
        if (e instanceof RuleError) return reply(msg.type === "hello" ? { type: "error", reason: e.message } : { type: "rejected", seq: msg.seq, reason: e.message });
        log("socket error:", e);
        reply({ type: "rejected", seq: msg.seq, reason: "Something went wrong on the host." });
      }
    });

    ws.on("close", () => {
      clearTimeout(helloTimer);
      if (room && client) {
        room.clients.delete(client);
        room.broadcast([{ type: "disconnected", seatId: client.seat ? client.seat.id : null }]);
      }
    });
  });

  // Keep connections (and tunnels) alive, and drop dead ones.
  const pinger = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) { ws.terminate(); continue; }
      ws.isAlive = false;
      ws.ping();
    }
  }, 25_000);

  return {
    server, rooms, store, adminToken,
    get publicUrl() { return linkBase(); },
    setPublicUrl(u) { base = u; },
    openRoom,
    listen: () => new Promise((ok) => server.listen(port, () => { port = server.address().port; ok(port); })),
    close: () => new Promise((ok) => { clearInterval(pinger); for (const r of rooms.values()) r.stop(); for (const ws of wss.clients) ws.terminate(); wss.close(); server.close(() => ok()); }),
  };
}
