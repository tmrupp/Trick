import test from "node:test";
import assert from "node:assert/strict";
import { resultFor, compareGoals, replay, viewFor, apply, createGame } from "../engine/index.mjs";
import { playCheck } from "../engine/bot.mjs";
import { game, dealt, rig, run, lock, find, hand, card } from "./helpers.mjs";

test("the outcome ladder", () => {
  assert.equal(resultFor(10, 10), "critical");
  assert.equal(resultFor(7, 10), "success");
  assert.equal(resultFor(6, 10), "partial");
  assert.equal(resultFor(4, 10), "partial");
  assert.equal(resultFor(3, 10), "failure");
  assert.equal(resultFor(11, 10), "bust");
});

test("incompatible goals: the better result wins, then the closer tally, else a stalemate", () => {
  const r = { a: { result: "success", tally: 8, target: 10 }, b: { result: "partial", tally: 5, target: 10 }, c: { result: "success", tally: 9, target: 10 }, d: { result: "success", tally: 9, target: 10 } };
  assert.equal(compareGoals(r, "a", "b"), "a");
  assert.equal(compareGoals(r, "a", "c"), "c");
  assert.equal(compareGoals(r, "c", "d"), null);
});

test("setup: targets, approaches and approval are required before the deal", () => {
  let s = game(["ana"]);
  ({ state: s } = run(s, { type: "beginCheck", kind: "solo", participants: ["ana"] }));
  assert.equal(s.check.tricks, 6);
  assert.throws(() => run(s, { type: "deal" }), /no target/);
  ({ state: s } = run(s, { type: "setGoal", charId: "ana", goal: "Hold the door", target: 6 }, { type: "declareApproach", charId: "ana", suit: "S" }));
  assert.throws(() => run(s, { type: "deal" }), /isn't approved/);
  ({ state: s } = run(s, { type: "approveApproach", charId: "ana" }, { type: "deal" }));
  assert.equal(hand(s, "ana").length, 6);
  assert.equal(s.check.worldRow.length, 6);
  assert.equal(s.check.worldDeck.length, 34);
});

test("check sizes: standard 3 per player + 1, quick 2 per player + 1", () => {
  let s = game();
  ({ state: s } = run(s, { type: "beginCheck", participants: ["ana", "ben", "cara"] }));
  assert.equal(s.check.tricks, 10);
  s = game();
  ({ state: s } = run(s, { type: "beginCheck", kind: "quick", participants: ["ana", "ben", "cara"] }));
  assert.equal(s.check.tricks, 7);
});

test("cleanup: unplayed cards, then the played row, then consequences with Injuries last", () => {
  let s = dealt(game());
  s.check.trick = s.check.tricks - 1;
  rig(s, { row: ["S5"], hands: { ana: ["S7", "I3"], ben: ["D1"], cara: ["I1"] } });
  ({ state: s } = run(s, lock(s, "ana", "S7"), lock(s, "ben", "D1"), lock(s, "cara", "I1")));
  ({ state: s } = run(s,
    { type: "addConsequence", charId: "ana", suit: "S" },
    { type: "addConsequence", charId: "ana", suit: "I" },
    { type: "endCheck" }));
  const d = s.characters.ana.discard;
  assert.equal(d.at(-1).status && d.at(-1).suit, "S", "the Injury is on top");
  assert.equal(d.at(-2).status && d.at(-2).suit, "I");
  assert.equal(d.at(-3).v, 7, "the played row comes before consequences");
  assert.equal(d.at(-4).v, 3, "unplayed cards come first");
  assert.equal(s.check.phase, "closed");
  assert.equal(s.lastCheckTricks, 10);
});

test("survival: two Injuries on top of discard force survival at target 3 × M; failing it is death", () => {
  let s = game();
  ({ state: s } = run(s, { type: "gainStatus", charId: "ana", suit: "S" }));
  assert.equal(s.characters.ana.survival, null);
  ({ state: s } = run(s, { type: "gainStatus", charId: "ana", suit: "S" }));
  assert.deepEqual(s.characters.ana.survival, { M: 2, N: 2 });
  ({ state: s } = run(s, { type: "beginCheck", participants: ["ana", "ben", "cara"] }));
  assert.equal(s.check.players.ana.target, 6);
  assert.throws(() => run(s, { type: "setGoal", charId: "ana", target: 10 }), /forced goal at target 6/);
  // A survival check that busts kills.
  let t = game();
  ({ state: t } = run(t, { type: "gainStatus", charId: "ana", suit: "S" }, { type: "gainStatus", charId: "ana", suit: "S" }));
  t = dealt(t);
  t.check.players.ana.tally = [{ card: card("S9", "world"), mirrored: false, score: 9 }];
  t.check.trick = t.check.tricks - 1;
  rig(t, { row: ["S1"], hands: { ana: ["D1"], ben: ["D2"], cara: ["I1"] } });
  ({ state: t } = run(t, lock(t, "ana", "D1"), lock(t, "ben", "D2"), lock(t, "cara", "I1")));
  assert.equal(t.check.results.ana.result, "bust");
  assert.equal(t.check.results.ana.dies, true);
  ({ state: t } = run(t, { type: "endCheck" }));
  assert.equal(t.characters.ana.alive, false);
  assert.throws(() => run(t, { type: "beginCheck", participants: ["ana"] , kind: "solo"}), /dead/);
});

test("the check-start scan counts Injuries in the top N discard cards", () => {
  let s = game();
  const ana = s.characters.ana;
  ana.discard.push(card("Sx", "ana"), card("S3", "ana"), card("Sx", "ana"));
  ({ state: s } = run(s, { type: "beginCheck", participants: ["ana", "ben", "cara"] }));
  assert.equal(s.check.players.ana.survival.M, 2);
  assert.equal(s.check.players.ana.target, 6);
});

test("Curses: a first Curse needs a compulsion; violations gain Stress per Curse out; rest leaves Curses", () => {
  let s = game();
  assert.throws(() => run(s, { type: "gainStatus", charId: "cara", suit: "W" }), /compulsion/);
  ({ state: s } = run(s, { type: "gainStatus", charId: "cara", suit: "W", compulsion: "Never refuse a dare" }, { type: "gainStatus", charId: "cara", suit: "W" }));
  assert.deepEqual(s.characters.cara.compulsion, ["Never refuse a dare"]);
  const stressBefore = s.characters.cara.discard.filter((c) => c.status && c.suit === "I").length;
  ({ state: s } = run(s, { type: "curseViolation", charId: "cara" }));
  assert.equal(s.characters.cara.discard.filter((c) => c.status && c.suit === "I").length, stressBefore + 2);
  const curse = s.characters.cara.discard.find((c) => c.status && c.suit === "W");
  assert.throws(() => run(s, { type: "rest", charId: "cara", cardIds: [curse.id] }), /non-Curse/);
  const stress = s.characters.cara.discard.find((c) => c.status && c.suit === "I");
  ({ state: s } = run(s, { type: "rest", charId: "cara", cardIds: [stress.id] }));
  assert.ok(!s.characters.cara.discard.some((c) => c.id === stress.id));
});

test("drawing Stress gains another Stress into discard", () => {
  let s = game();
  s.characters.ana.deck.push(card("Ix", "ana"));
  s = dealt(s);
  assert.ok(hand(s, "ana").some((c) => c.status && c.suit === "I"));
  assert.equal(s.characters.ana.discard.filter((c) => c.status && c.suit === "I").length, 1);
});

test("evolution on a reshuffle: return a status and an ordinary card, or skip", () => {
  let s = game(["ana"]);
  const ana = s.characters.ana;
  // Empty the deck into discard with two Injuries, so the deal must reshuffle.
  ana.discard.push(...ana.deck.splice(0), card("Dx", "ana"), card("Dx", "ana"));
  ({ state: s } = run(s, { type: "beginCheck", kind: "solo", participants: ["ana"] },
    { type: "setGoal", charId: "ana", target: 6 }, { type: "declareApproach", charId: "ana", suit: "S" }, { type: "approveApproach", charId: "ana" }, { type: "deal" }));
  assert.equal(s.check.phase, "deal");
  assert.deepEqual(s.check.pending.map((x) => x.type), ["evolve"]);
  const back = s.characters.ana.discard.find((c) => !c.status && c.suit === "D");
  const reserveBefore = s.characters.ana.reserve.length;
  ({ state: s } = run(s, { type: "evolve", charId: "ana", suit: "D", mode: "return", cardId: back.id }));
  assert.equal(s.check.phase, "play");
  assert.equal(hand(s, "ana").length, 6);
  assert.equal(s.characters.ana.reserve.length, reserveBefore + 2, "one Stumble and one ordinary Spade returned");
});

test("replay: a seed and its actions rebuild the same game", () => {
  let s = game(["ana", "ben", "cara"], "replay");
  ({ state: s } = playCheck(s, { goals: { ana: { target: 10, approach: "S" }, ben: { target: 10, approach: "D" }, cara: { target: 9, approach: "I" } }, consequences: [{ charId: "ben", suit: "S" }] }));
  const again = replay({ seed: "replay" }, s.actions);
  assert.deepEqual(again, s);
});

test("cards are never lost or duplicated over many bot checks", () => {
  let s = game(["ana", "ben", "cara"], "conservation");
  const ids = () => {
    const all = [];
    for (const ch of Object.values(s.characters)) all.push(...ch.deck, ...ch.discard, ...ch.reserve);
    if (s.check && s.check.phase !== "closed") for (const p of Object.values(s.check.players)) all.push(...p.hand, ...p.played);
    return all.map((c) => c.id);
  };
  for (let i = 0; i < 40; i++) {
    const cons = i % 3 === 0 ? [{ charId: ["ana", "ben", "cara"][i % 3], suit: ["S", "D", "I"][i % 3] }] : [];
    const goals = {};
    for (const id of ["ana", "ben", "cara"]) if (s.characters[id].alive) goals[id] = { target: 6 + (i % 10), approach: s.characters[id].primary };
    if (!Object.keys(goals).length) break;
    if (i % 5 === 4) for (const id of Object.keys(goals)) ({ state: s } = run(s, { type: "grantBlessed", charId: id }));
    ({ state: s } = playCheck(s, { goals, consequences: cons.filter((c) => goals[c.charId]) }));
    const all = ids();
    assert.equal(all.length, 3 * 108, `check ${i}: card count`);
    assert.equal(new Set(all).size, all.length, `check ${i}: duplicates`);
  }
});

test("views: the table sees no hands; a phone sees only its own hand and its own Peek", () => {
  let s = dealt(game());
  rig(s, { row: ["S9", "I8"], hands: { ana: ["D1", "S2"], ben: ["D2", "D3"], cara: ["I1", "I2"] }, worldDeck: ["W1", "S6", "S4"] });
  const anaCards = hand(s, "ana").map((c) => c.id);
  const table = JSON.stringify(viewFor(s, { role: "table" }));
  for (const id of anaCards) assert.ok(!table.includes(id), "the table never sees a hand card");
  const benView = JSON.stringify(viewFor(s, { role: "player", charId: "ben" }));
  for (const id of anaCards) assert.ok(!benView.includes(id), "another phone never sees Ana's hand");
  ({ state: s } = run(s, lock(s, "ana", "D1"), lock(s, "ben", "D2"), lock(s, "cara", "I1")));
  const anaPrompts = viewFor(s, { role: "player", charId: "ana" }).prompts;
  const benPrompts = viewFor(s, { role: "player", charId: "ben" }).prompts;
  assert.equal(anaPrompts[0].top.label, "4♥");
  assert.equal(benPrompts[0].top, null, "the second Peek waits its turn");
  assert.ok(!JSON.stringify(viewFor(s, { role: "table" })).includes(s.check.worldDeck.at(-1).id), "the table never sees the world deck");
});
