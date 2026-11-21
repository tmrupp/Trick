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
    return c.waitFor((m) => m.type === "welcome" || m.type === "error" || m.type === "closed");
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
    for (const c of [gm, table]) assert.equal((await c.ready).type, "welcome");
    // Join one at a time so seat ids follow join order.
    const players = [];
    for (const name of ["Ana", "Ben", "Cara"]) {
      const c = client(port, { room: code, as: "player", name });
      assert.equal((await c.ready).type, "welcome");
      players.push(c);
    }

    const suits = [["S", "D", ["I", "W"]], ["D", "I", ["S", "W"]], ["I", "W", ["S", "D"]]];
    for (const [i, c] of players.entries()) {
      const [primary, secondary, others] = suits[i];
      assert.equal((await c.act({ type: "createCharacter", name: ["Ana", "Ben", "Cara"][i], primary, secondary, others })).type, "ok");
    }
    await settle();
    const ids = players.map((c) => c.latest().room.you.charId);
    assert.deepEqual(ids, ["p1", "p2", "p3"]);

    // Only the GM runs setup, and players act only for themselves.
    assert.equal((await players[0].act({ type: "beginCheck", participants: ids })).type, "rejected");
    assert.equal((await gm.act({ type: "beginCheck", participants: ids })).type, "ok");
    const again = await players[0].act({ type: "createCharacter", name: "Again", primary: "S", secondary: "D", others: ["I", "W"] });
    assert.equal(again.reason, "Finish this check before making a new character.");
    assert.equal((await players[0].act({ type: "declareApproach", charId: "p2", suit: "S", goal: "Cross the river" })).reason, "You can only act for your own character.");
    for (const [i, c] of players.entries()) assert.equal((await c.act({ type: "declareApproach", charId: ids[i], suit: suits[i][0], goal: "Cross the river" })).type, "ok");
    assert.equal((await players[0].act({ type: "setGoal", charId: ids[0], target: 6 })).type, "rejected", "only the GM sets targets");
    for (const id of ids) assert.equal((await gm.act({ type: "setGoal", charId: id, target: 10 })).type, "ok");
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
          : prompt.type === "peek" ? { type: "peek", charId: prompt.charId, replace: prompt.charId === "p2" }
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

test("a player on a new browser takes their character back; a restarted host opens rooms on demand", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  let { host, port, api } = await startHost(dir);
  try {
    const created = await api("/api/campaigns", { name: "Back again", seed: "back" });
    const { code } = created.body.rooms[0];
    const ana = client(port, { room: code, as: "player", name: "Tess" });
    await ana.ready;
    await ana.act({ type: "createCharacter", name: "Ana", primary: "S", secondary: "D", others: ["I", "W"] });
    const oldToken = ana.welcome.token;
    // While Ana's phone is connected, nobody can take her character.
    assert.deepEqual((await api(`/api/rooms/${code}/returning`)).body.returning, []);
    const thief = client(port, { room: code, as: "player", reclaim: "p1" });
    assert.match((await thief.ready).reason, /already connected/);
    await thief.close();
    await ana.close();
    await settle();

    // The host restarts and nobody reopens the campaign: the room still opens when a phone asks for it.
    await host.close();
    ({ host, port, api } = await startHost(dir));
    const list = await api(`/api/rooms/${code.toLowerCase()}/returning`);
    assert.deepEqual(list.body.returning, [{ seatId: "p1", name: "Tess", character: "Ana" }]);
    assert.equal((await api("/api/rooms/ZZZZZ/returning")).status, 404);

    // On a new browser (no saved token) Ana taps her character and gets it back, with a fresh token.
    const back = client(port, { room: code, as: "player", reclaim: "p1" });
    const w = await back.ready;
    assert.equal(w.type, "welcome");
    assert.equal(w.seatId, "p1");
    assert.notEqual(w.token, oldToken);
    await settle();
    assert.equal(back.latest().room.you.charId, "p1");
    // The old browser's token no longer works.
    const stale = client(port, { room: code, as: "player", token: oldToken });
    assert.match((await stale.ready).reason, /Enter your name/);
    for (const c of [back, stale]) await c.close();
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a player makes another character after a death, switches between them, and the GM brings one back", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  const { host, port, api } = await startHost(dir);
  try {
    const { code, gmKey } = (await api("/api/campaigns", { name: "Lives", seed: "lives" })).body.rooms[0];
    const gm = client(port, { room: code, as: "gm", gmKey });
    const ana = client(port, { room: code, as: "player", name: "Tess" });
    await gm.ready; await ana.ready;
    await ana.act({ type: "createCharacter", name: "Ana", primary: "S", secondary: "D", others: ["I", "W"] });
    await settle();
    // Ana dies (the room's state is edited directly, as a survival bust would leave it).
    host.rooms.get(code).state.characters.p1.alive = false;
    assert.equal((await ana.act({ type: "createCharacter", name: "Bea", primary: "D", secondary: "I", others: ["S", "W"] })).type, "ok");
    await settle();
    let you = ana.latest().room.you;
    assert.equal(you.charId, "p1-2", "the new character gets its own id and becomes the one played");
    assert.deepEqual(you.chars, ["p1", "p1-2"]);
    assert.equal((await ana.act({ type: "resurrect", charId: "p1" })).reason, "Only the GM can do that.");
    assert.equal((await gm.act({ type: "resurrect", charId: "p1" })).type, "ok");
    assert.equal((await gm.act({ type: "resurrect", charId: "p1" })).type, "rejected", "only the dead come back");
    // Ana is alive again but Tess plays Bea now: Ana can't be put in a check.
    assert.equal((await gm.act({ type: "beginCheck", participants: ["p1"] })).reason, "Ana isn't being played by anyone right now.");
    assert.equal((await ana.manage({ op: "switch", charId: "p1" })).type, "ok");
    await settle();
    you = ana.latest().room.you;
    assert.equal(you.charId, "p1");
    assert.equal(ana.latest().view.characters.p1.alive, true);
    assert.equal((await ana.manage({ op: "switch", charId: "gm" })).type, "rejected", "only your own characters");
    assert.equal((await ana.act({ type: "lockCard", charId: "p1-2", cardId: "x" })).reason, "You can only act for your own character.", "you act as the one you're playing");
    // The GM's card edits reach the GM and that character's player only.
    const ben = client(port, { room: code, as: "player", name: "Rob" });
    const table = client(port, { room: code, as: "table" });
    await ben.ready; await table.ready;
    assert.equal((await gm.act({ type: "gmAddCard", charId: "p1", suit: "S", v: 10, to: "deck-top" })).type, "ok");
    await settle();
    const heard = (c) => c.views.some((v) => v.events.some((e) => e.type === "gmCardAdded"));
    assert.ok(heard(gm) && heard(ana), "the GM and Ana's player see it");
    assert.ok(!heard(ben) && !heard(table), "other phones and the table don't");
    for (const c of [gm, ana, ben, table]) await c.close();
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the GM adds bots; they declare, answer and play on their own; a left-to-right bot's hand is open to all", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  const host = createServer({ port: 0, savesDir: dir, log: () => {}, botDelay: 5 });
  const port = await host.listen();
  try {
    const r = await fetch(`http://localhost:${port}/api/campaigns`, { method: "POST", headers: { "x-admin": host.adminToken, "content-type": "application/json" }, body: JSON.stringify({ name: "Bots", seed: "bots" }) });
    const { code, gmKey } = (await r.json()).rooms[0];
    const gm = client(port, { room: code, as: "gm", gmKey });
    const table = client(port, { room: code, as: "table" });
    await gm.ready; await table.ready;
    assert.equal((await gm.manage({ op: "addBot", kind: "greedy", primary: "S" })).type, "ok");
    assert.equal((await gm.manage({ op: "addBot", kind: "ltr", primary: "W", name: "The Spirit" })).type, "ok");
    await settle();
    let seats = gm.latest().room.seats.filter((s) => s.role === "bot");
    assert.deepEqual(seats.map((s) => [s.id, s.name, s.charId]), [["b1", "Greedy 1", "b1"], ["b2", "The Spirit", "b2"]]);
    assert.equal((await gm.act({ type: "renameCharacter", charId: "b1", name: "Sergeant Vell" })).type, "ok");
    await settle();
    seats = gm.latest().room.seats.filter((s) => s.role === "bot");
    assert.equal(seats[0].name, "Sergeant Vell", "the bot's seat takes the new name");
    assert.equal(gm.latest().view.characters.b1.name, "Sergeant Vell");
    assert.equal((await gm.act({ type: "renameCharacter", charId: "b1", name: "  " })).type, "rejected");
    assert.equal(gm.latest().view.characters.b2.bot, "ltr");
    assert.equal((await gm.act({ type: "beginCheck", participants: ["b1", "b2"] })).type, "ok");
    const wait = (pred) => new Promise((ok, fail) => { const t0 = Date.now(); const tick = () => { const v = gm.latest(); if (pred(v)) return ok(v); if (Date.now() - t0 > 4000) return fail(new Error("timed out")); setTimeout(tick, 20); }; tick(); });
    await wait((v) => v.view.check.players.b1.approach && v.view.check.players.b2.approach);
    for (const id of ["b1", "b2"]) assert.equal((await gm.act({ type: "setGoal", charId: id, target: 8 })).type, "ok");
    assert.equal((await gm.act({ type: "deal" })).type, "ok");
    await settle();
    // Everyone, the table included, sees the left-to-right bot's hand in order; the greedy bot's stays hidden.
    const firstView = table.views.find((v) => v.view.check && v.view.check.phase === "play" && v.view.check.trick === 0);
    const open = firstView.view.check.players.b2.openHand;
    assert.ok(open && open.length > 0);
    assert.equal(firstView.view.check.players.b1.openHand, null);
    // The bots play the whole check by themselves.
    const done = await wait((v) => v.view.check && v.view.check.phase === "resolve");
    assert.ok(done.view.check.results.b1 && done.view.check.results.b2);
    // The left-to-right bot played its leftmost legal card: its first play was the first legal card shown.
    const first = done.view.check.log[0].plays.find((p) => p.id === "b2");
    const w = firstView.view.check.worldRow[0];
    const forced = open.find((c) => c.status && c.suit === w.suit);
    assert.equal(first.card, (forced || open[0]).id);
    for (const c of [gm, table]) await c.close();
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the host closes a campaign: screens disconnect and stay out, the save stays, and it opens again", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  const { host, port, api } = await startHost(dir);
  try {
    const { id, code } = (await api("/api/campaigns", { name: "Closing", seed: "close" })).body.rooms[0];
    const table = client(port, { room: code, as: "table" });
    await table.ready;
    const told = table.waitFor((m) => m.type === "closed" && /closed this campaign/.test(m.reason));
    const closed = await api("/api/close", { id });
    assert.equal(closed.status, 200);
    assert.ok(!closed.body.rooms.some((r) => r.id === id), "the room is no longer open");
    assert.ok(closed.body.campaigns.some((c) => c.id === id), "the save stays");
    await told;
    assert.equal((await api("/api/close", { id })).status, 400);
    // A screen that reconnects (a table tab, a phone waking up) is turned away; it doesn't reopen the campaign.
    const back = client(port, { room: code, as: "table" });
    assert.equal((await back.ready).type, "closed");
    assert.ok(!(await api("/api/info")).body.rooms.some((r) => r.id === id), "still closed");
    assert.equal((await fetch(`http://localhost:${port}/api/rooms/${code}/returning`)).status, 404);
    assert.ok((await api("/api/open", { id })).body.rooms.some((r) => r.id === id), "it opens again");
    const again = client(port, { room: code, as: "table" });
    assert.equal((await again.ready).type, "welcome", "screens join once it's open");
    for (const c of [table, back, again]) await c.close();
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a browser's remembered seat isn't taken over by a second tab; that tab joins as someone else", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  const { host, port, api } = await startHost(dir);
  try {
    const { code } = (await api("/api/campaigns", { name: "Tabs", seed: "tabs" })).body.rooms[0];
    const tab1 = client(port, { room: code, as: "player", name: "Tess" });
    const w1 = await tab1.ready;
    // A second tab offers the browser's remembered token: the seat is open, so it's refused.
    const tab2 = client(port, { room: code, as: "player", token: w1.token, claimIfFree: true });
    assert.match((await tab2.ready).reason, /open in another tab/);
    await tab2.close();
    // It joins fresh instead, as a new seat.
    const tab2b = client(port, { room: code, as: "player", name: "Tess (second tab)" });
    const w2 = await tab2b.ready;
    assert.equal(w2.type, "welcome");
    assert.notEqual(w2.seatId, w1.seatId);
    // Once the first tab closes, a later tab can pick up the remembered seat again.
    await tab1.close();
    await settle();
    const tab3 = client(port, { room: code, as: "player", token: w1.token, claimIfFree: true });
    assert.equal((await tab3.ready).seatId, w1.seatId);
    for (const c of [tab2b, tab3]) await c.close();
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("notes: shared text everyone edits, the GM's only for the GM, a player's own only for that player", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  let { host, port, api } = await startHost(dir);
  try {
    const { code, gmKey, id } = (await api("/api/campaigns", { name: "Notes", seed: "notes" })).body.rooms[0];
    const gm = client(port, { room: code, as: "gm", gmKey });
    const ana = client(port, { room: code, as: "player", name: "Tess" });
    const ben = client(port, { room: code, as: "player", name: "Rob" });
    const table = client(port, { room: code, as: "table" });
    for (const c of [gm, ana, ben, table]) await c.ready;
    await settle();
    const first = (c) => c.all.find((m) => m.type === "notes" && m.all).notes;
    assert.deepEqual(Object.keys(first(gm)).sort(), ["gm", "shared"]);
    assert.deepEqual(Object.keys(first(ana)).sort(), ["mine", "shared"]);
    assert.deepEqual(Object.keys(first(table)), ["shared"]);
    assert.equal((await ana.manage({ op: "editNotes", scope: "shared", text: "The bell rings at dusk." })).type, "ok", "players edit shared notes");
    assert.equal((await gm.manage({ op: "editNotes", scope: "gm", text: "The sheriff is lying." })).type, "ok");
    assert.equal((await ana.manage({ op: "editNotes", scope: "mine", text: "I owe Ben a favour." })).type, "ok");
    assert.equal((await ana.manage({ op: "editNotes", scope: "gm", text: "x" })).type, "rejected", "only the GM keeps GM notes");
    assert.equal((await ana.manage({ op: "importNotes", scope: "mine", url: "https://example.com/x" })).type, "rejected", "imports take Google Docs links");
    await settle();
    const heard = (c, text) => c.all.some((m) => m.type === "notes" && JSON.stringify(m.notes).includes(text));
    for (const c of [gm, ana, ben, table]) assert.ok(heard(c, "The bell rings at dusk."), "everyone hears shared notes");
    assert.ok(heard(gm, "The sheriff is lying.") && ![ana, ben, table].some((c) => heard(c, "The sheriff is lying.")), "only the GM hears GM notes");
    assert.ok(heard(ana, "I owe Ben a favour.") && ![gm, ben, table].some((c) => heard(c, "I owe Ben a favour.")), "only Ana hears her notes");
    const sharedNote = gm.all.filter((m) => m.type === "notes" && m.notes.shared).pop().notes.shared;
    assert.equal(sharedNote.by, "Tess");
    for (const c of [gm, ana, ben, table]) await c.close();
    // The notes are kept with the campaign.
    await host.close();
    ({ host, port, api } = await startHost(dir));
    const room = host.openRoom(id);
    assert.equal(room.notesFor(room.seatById("gm")).gm.text, "The sheriff is lying.");
    assert.equal(room.notesFor(room.seatById("p1")).mine.text, "I owe Ben a favour.");
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

test("a campaign keeps the rules it began under: new ones use the automatic consolations, older imports keep Peek", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trick-saves-"));
  const { host, api } = await startHost(dir);
  try {
    const { id } = (await api("/api/campaigns", { name: "Rules", seed: "rules" })).body.rooms[0];
    assert.deepEqual(host.store.read(id).rules, { consolations: 2, stumble: "deck", world: "lose" });
    assert.deepEqual([...host.rooms.values()].find((r) => r.save.id === id).state.rules, { consolations: 2, stumble: "deck", world: "lose" });
    // A save from before has no rules of its own: it replays under Peek and the choosing Recalculate.
    const old = (await api("/api/import", { name: "Old", seed: "old", gmSeat: 0, actions: [], seats: [] })).body;
    const imported = old.campaigns.find((c) => /Old/.test(c.name));
    assert.deepEqual(host.store.read(imported.id).rules, { peek: "choose" });
    assert.deepEqual([...host.rooms.values()].find((r) => r.save.id === imported.id).state.rules, { peek: "choose" });
  } finally {
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
