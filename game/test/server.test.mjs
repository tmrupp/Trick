// End-to-end tests of the host server with scripted clients standing in for phones.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { createServer } from "../server/app.mjs";

function client(port, hello) {
  const ws = new WebSocket(`ws://localhost:${port}/ws`);
  const c = { ws, views: [], all: [], welcome: null, waiters: [], seq: 0 };
  c.latest = () => c.views[c.views.length - 1];
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    c.all.push(msg);
    if (msg.type === "welcome") c.welcome = msg;
    if (msg.type === "view") c.views.push(msg);
    c.waiters = c.waiters.filter((w) => !w(msg));
  });
  c.waitFor = (pred, ms = 5000) => new Promise((ok, fail) => {
    const t = setTimeout(() => fail(new Error("timed out waiting")), ms);
    c.waiters.push((msg) => (pred(msg) ? (clearTimeout(t), ok(msg), true) : false));
  });
  c.ready = new Promise((ok) => ws.on("open", ok)).then(() => {
    ws.send(JSON.stringify({ type: "hello", ...hello }));
    return c.waitFor((m) => m.type === "welcome" || m.type === "error");
  });
  // Send an action and wait for the host's answer.
  c.act = async (action) => {
    const seq = ++c.seq;
    const answer = c.waitFor((m) => (m.type === "ok" || m.type === "rejected") && m.seq === seq);
    ws.send(JSON.stringify({ type: "action", seq, action }));
    return answer;
  };
  c.manage = async (op) => {
    const seq = ++c.seq;
    const answer = c.waitFor((m) => (m.type === "ok" || m.type === "rejected") && m.seq === seq);
    ws.send(JSON.stringify({ type: "manage", seq, ...op }));
    return answer;
  };
  c.close = () => new Promise((ok) => { if (ws.readyState === WebSocket.CLOSED) return ok(); ws.on("close", ok); ws.close(); });
  return c;
}

const settle = () => new Promise((ok) => setTimeout(ok, 30));

async function startHost(savesDir) {
  const host = createServer({ port: 0, savesDir, log: () => {} });
  const port = await host.listen();
  const api = async (path, body, admin = host.adminToken) => {
    const r = await fetch(`http://localhost:${port}${path}`, { method: body ? "POST" : "GET", headers: { "x-admin": admin, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json() };
  };
  return { host, port, api };
}

test("a room plays a whole check over WebSockets, keeps hands private, survives drops and restarts", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  let { host, port, api } = await startHost(dir);
  try {
    assert.equal((await api("/api/info", null, "wrong")).status, 403, "the admin API needs the token");
    const created = await api("/api/campaigns", { name: "Black Valley", seed: "server-test" });
    const { code, gmKey } = created.body.rooms[0];
    assert.match(code, /^[A-Z]{5}$/);

    const bad = client(port, { room: code, as: "gm", gmKey: "nope" });
    assert.equal((await bad.ready).type, "error");
    await bad.close();

    const gm = client(port, { room: code, as: "gm", gmKey });
    const table = client(port, { room: code, as: "table" });
    const players = ["Ana", "Ben", "Cara"].map((name) => client(port, { room: code, as: "player", name }));
    for (const c of [gm, table, ...players]) assert.equal((await c.ready).type, "welcome");

    const suits = [["S", "D", ["I", "W"]], ["D", "I", ["S", "W"]], ["I", "W", ["S", "D"]]];
    for (const [i, c] of players.entries()) {
      const [primary, secondary, others] = suits[i];
      assert.equal((await c.act({ type: "createCharacter", name: ["Ana", "Ben", "Cara"][i], primary, secondary, others })).type, "ok");
    }
    await settle();
    const ids = players.map((c) => c.latest().room.you.charId);
    assert.deepEqual(ids, ["p1", "p2", "p3"]);
    assert.equal((await players[0].act({ type: "createCharacter", name: "Again", primary: "S", secondary: "D", others: ["I", "W"] })).type, "rejected");

    // Only the GM runs setup, and players act only for themselves.
    assert.equal((await players[0].act({ type: "beginCheck", participants: ids })).type, "rejected");
    assert.equal((await gm.act({ type: "beginCheck", participants: ids })).type, "ok");
    for (const id of ids) assert.equal((await gm.act({ type: "setGoal", charId: id, goal: "Cross the river", target: 10 })).type, "ok");
    assert.equal((await players[0].act({ type: "declareApproach", charId: "p2", suit: "S" })).reason, "You can only act for your own character.");
    for (const [i, c] of players.entries()) await c.act({ type: "declareApproach", charId: ids[i], suit: suits[i][0] });
    for (const id of ids) await gm.act({ type: "approveApproach", charId: id });
    assert.equal((await gm.act({ type: "deal" })).type, "ok");
    await settle();

    // Play: each phone answers its prompts and locks its first legal card.
    let dropped = false;
    for (let guard = 0; guard < 200; guard++) {
      await settle();
      const g = gm.latest().view;
      if (g.check.phase === "resolve") break;
      // Private information: no phone ever sees another hand.
      for (const [i, c] of players.entries()) {
        const seen = JSON.stringify(c.latest());
        for (const [j, other] of ids.entries()) if (i !== j) for (const card of g.hands[other]) assert.ok(!seen.includes(card.id), `${ids[i]} saw ${other}'s ${card.id}`);
        assert.ok(!JSON.stringify(table.latest()).includes(g.hands[ids[i]][0]?.id ?? "none"), "the table saw a hand");
      }
      if (!dropped && g.check.trick === 3) {
        // Ben's phone sleeps and comes back with its token.
        const token = players[1].welcome.token;
        await players[1].close();
        players[1] = client(port, { room: code, as: "player", token });
        const w = await players[1].ready;
        assert.equal(w.seatId, "p2", "the same seat after reconnecting");
        await settle();
        assert.ok(players[1].latest().view.hand.length > 0, "the hand comes back");
        dropped = true;
        continue;
      }
      const prompt = g.pending[0];
      if (prompt) {
        const c = players[ids.indexOf(prompt.charId)];
        const hand = g.hands[prompt.charId];
        const a = prompt.type === "recalculate" ? { type: "recalculate", charId: prompt.charId, cardId: hand[0].id }
          : prompt.type === "evolve" ? { type: "evolve", charId: prompt.charId, skip: true }
          : { type: "evolvePick", charId: prompt.charId, cardId: prompt.options[0] };
        assert.equal((await c.act(a)).type, "ok");
        continue;
      }
      const id = ids.find((x) => !g.locks[x] && g.hands[x].length);
      const legal = g.legal[id];
      assert.equal((await players[ids.indexOf(id)].act({ type: "lockCard", charId: id, cardId: legal[0] })).type, "ok");
    }
    assert.ok(dropped);
    const resolved = gm.latest().view.check;
    assert.equal(resolved.phase, "resolve");
    assert.equal(Object.keys(resolved.results).length, 3);
    assert.equal(table.latest().view.check.phase, "resolve", "the table follows along");
    await gm.act({ type: "addConsequence", charId: "p1", suit: "S" });
    assert.equal((await gm.act({ type: "endCheck" })).type, "ok");

    // The GM removes Cara's seat; her phone is told and can't rejoin with its token.
    const caraToken = players[2].welcome.token;
    const removed = players[2].waitFor((m) => m.type === "removed");
    assert.equal((await gm.manage({ op: "remove", seatId: "p3" })).type, "ok");
    await removed;
    const back = client(port, { room: code, as: "player", token: caraToken });
    assert.equal((await back.ready).reason, "The GM removed this seat.");
    await back.close();

    const before = gm.latest().view;
    for (const c of [gm, table, players[0], players[1]]) await c.close();
    await host.close();

    // Restart the host: the campaign replays from its save, and old tokens still work.
    ({ host, port, api } = await startHost(dir));
    const listed = await api("/api/info");
    assert.equal(listed.body.campaigns.length, 1);
    await api("/api/open", { id: listed.body.campaigns[0].id });
    const gm2 = client(port, { room: code, as: "gm", gmKey });
    await gm2.ready;
    await settle();
    const after = gm2.latest().view;
    assert.deepEqual(after.characters, before.characters);
    assert.deepEqual(after.history, before.history);
    const ana = client(port, { room: code, as: "player", token: players[0].welcome.token });
    assert.equal((await ana.ready).seatId, "p1");
    await gm2.close();
    await ana.close();
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("campaigns download, import with their code, archive, and hand characters to new seats", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  const { host, port, api } = await startHost(dir);
  try {
    const created = await api("/api/campaigns", { name: "Moving", seed: "move" });
    const { code, gmKey, id } = created.body.rooms[0];
    const gm = client(port, { room: code, as: "gm", gmKey });
    const ana = client(port, { room: code, as: "player", name: "Ana" });
    await gm.ready; await ana.ready;
    await ana.act({ type: "createCharacter", name: "Ana", primary: "S", secondary: "D", others: ["I", "W"] });
    // Ana switches phones: a new seat joins by name, and the GM gives it her character.
    const phone2 = client(port, { room: code, as: "player", name: "Ana again" });
    const w2 = await phone2.ready;
    const removed = ana.waitFor((m) => m.type === "removed");
    assert.equal((await gm.manage({ op: "assign", seatId: w2.seatId, charId: "p1" })).type, "ok");
    await removed;
    await settle();
    assert.equal(phone2.latest().room.you.charId, "p1");
    assert.equal((await phone2.act({ type: "useItem", charId: "p1", itemId: "nope" })).type, "rejected", "items are checked");

    const exported = await api(`/api/export?id=${id}`);
    assert.equal(exported.status, 200);
    assert.equal(exported.body.gmKey, undefined, "downloads never include the GM key");
    // Archive closes the room; importing the download brings the campaign back with its code.
    const closed = new Promise((ok) => gm.ws.on("close", ok));
    await api("/api/archive", { id });
    await closed;
    const imported = await api("/api/import", exported.body);
    assert.equal(imported.status, 200);
    const room = imported.body.rooms.find((r) => r.name.startsWith("Moving"));
    assert.equal(room.code, code, "the room code is kept when free");
    assert.notEqual(room.gmKey, gmKey);
    assert.equal((await api("/api/import", { nonsense: true })).status, 400);
    for (const c of [gm, ana, phone2]) await c.close();
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("pages and the join link are served", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  const { host, port } = await startHost(dir);
  try {
    for (const path of ["/play", "/table", "/watch", "/gm", "/host", "/print", "/rules", "/shared/client.js", "/shared/style.css", "/suit_icons.js", "/card_rules.js", "/items/item_catalog.js", "/races/race_catalog.js"]) {
      const r = await fetch(`http://localhost:${port}${path}`);
      assert.equal(r.status, 200, path);
    }
    const r = await fetch(`http://localhost:${port}/j/abcde`, { redirect: "manual" });
    assert.equal(r.headers.get("location"), "/play?room=ABCDE");
    assert.equal((await fetch(`http://localhost:${port}/shared/../server/app.mjs`)).status, 404);
    const qr = await fetch(`http://localhost:${port}/qr.svg?text=${encodeURIComponent("https://example.com/j/ABCDE")}`);
    assert.match(await qr.text(), /<svg/);
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
