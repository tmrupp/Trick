import test from "node:test";
import assert from "node:assert/strict";
import { viewFor } from "../engine/index.mjs";
import { game, dealt, rig, run, lock, find, hand } from "./helpers.mjs";

test("items: given, used for the table to see, and taken away", () => {
  let s = game(["ana"]);
  let events;
  ({ state: s } = run(s, { type: "giveItem", charId: "ana", itemId: "slate-shard" }));
  assert.deepEqual(s.characters.ana.items, ["slate-shard"]);
  assert.throws(() => run(s, { type: "giveItem", charId: "ana", itemId: "slate-shard" }), /already has/);
  ({ state: s, events } = run(s, { type: "useItem", charId: "ana", itemId: "slate-shard", note: "Ana speaks to Ben" }));
  assert.equal(events[0].type, "itemUsed");
  ({ state: s } = run(s, { type: "loseItem", charId: "ana", itemId: "slate-shard" }));
  assert.deepEqual(s.characters.ana.items, []);
  assert.throws(() => run(s, { type: "useItem", charId: "ana", itemId: "slate-shard" }), /don't have/);
});

test("a people is recorded at creation and shown to everyone", () => {
  let s = game([]);
  ({ state: s } = run(s, { type: "createCharacter", id: "v", name: "Vee", primary: "S", secondary: "D", others: ["I", "W"], race: "varn" }));
  assert.equal(viewFor(s, { role: "table" }).characters.v.race, "varn");
  assert.throws(() => run(s, { type: "createCharacter", id: "x", primary: "S", secondary: "D", others: ["I", "W"], race: "<b>" }), /Unknown people/);
});

test("GM boost: the next card counts higher for beating, once", () => {
  let s = dealt(game());
  rig(s, { row: ["S8", "S8"], hands: { ana: ["S6", "S6"], ben: ["D1", "D2"], cara: ["I1", "I2"] } });
  ({ state: s } = run(s, { type: "gmBoost", charId: "ana", amount: 3, reason: "Slate Shard" }));
  ({ state: s } = run(s, lock(s, "ana", "S6"), lock(s, "ben", "D1"), lock(s, "cara", "I1")));
  assert.equal(s.check.log[0].winner, "ana");
  assert.equal(s.check.log[0].plays[0].boost, 3);
  assert.equal(s.check.players.ana.tally[0].score, 8, "a boost never changes the score");
  assert.equal(s.check.players.ana.boost, 0);
});

test("GM world value: a world card counts differently for beating but scores its printed value", () => {
  let s = dealt(game());
  rig(s, { row: ["S9"], hands: { ana: ["S2", "S1"], ben: ["D1", "D2"], cara: ["I1", "I2"] } });
  ({ state: s } = run(s, { type: "gmWorldValue", index: 0, value: 0, reason: "Whisper Jar" }));
  ({ state: s } = run(s, lock(s, "ana", "S2"), lock(s, "ben", "D1"), lock(s, "cara", "I1")));
  assert.equal(s.check.log[0].winner, "ana");
  assert.equal(s.check.players.ana.tally[0].score, 9);
  assert.throws(() => run(s, { type: "gmWorldValue", index: 0, value: 1 }), /unplayed/);
});

test("GM tally and target adjustments, draws and discards", () => {
  let s = dealt(game());
  const before = hand(s, "ben").length;
  ({ state: s } = run(s, { type: "gmDraw", charId: "ben", n: 2 }));
  assert.equal(hand(s, "ben").length, before + 2);
  const card = hand(s, "ben")[0];
  ({ state: s } = run(s, { type: "gmDiscard", charId: "ben", cardId: card.id }));
  assert.equal(s.characters.ben.discard.at(-1).id, card.id);
  ({ state: s } = run(s, { type: "gmAdjustTally", charId: "cara", delta: 2, reason: "item" }, { type: "gmAdjustTarget", charId: "cara", target: 12 }));
  assert.equal(viewFor(s, { role: "table" }).check.players.cara.total, 2);
  assert.equal(s.check.players.cara.target, 12);
});

test("trick logs carry card labels for the screens", () => {
  let s = dealt(game());
  rig(s, { row: ["S5"], hands: { ana: ["S7", "S1"], ben: ["D3", "D1"], cara: ["I1", "I2"] } });
  ({ state: s } = run(s, lock(s, "ana", "S7"), lock(s, "ben", "D3"), lock(s, "cara", "I1")));
  const e = s.check.log[0];
  assert.equal(e.worldLabel, "5♥");
  assert.deepEqual(e.plays.map((p) => p.label), ["7♥", "3♠", "A♦"]);
});

test("a player's view lists their deck's contents, sorted, never its order", () => {
  const s = game(["ana"]);
  const v = viewFor(s, { role: "player", charId: "ana" });
  assert.equal(v.characters.ana.deckCards.length, 20);
  const cards = v.characters.ana.deckCards;
  for (let i = 1; i < cards.length; i++) {
    const a = cards[i - 1], b = cards[i];
    assert.ok(a.suit < b.suit || (a.suit === b.suit && a.v <= b.v), `sorted at ${i}`);
  }
  assert.equal(viewFor(s, { role: "table" }).characters.ana.deckCards, undefined, "the table never sees deck contents");
});

test("players state their own goal and its suit; the GM sets the target", () => {
  let s = game(["ana", "ben"]);
  ({ state: s } = run(s, { type: "beginCheck", participants: ["ana", "ben"] },
    { type: "declareApproach", charId: "ana", suit: "S", goal: "Hold the gate until the bell" },
    { type: "setGoal", charId: "ana", target: 8, goal: "GM's words" }));
  assert.equal(s.check.players.ana.goal, "Hold the gate until the bell", "the GM doesn't overwrite a stated goal");
  assert.equal(s.check.players.ana.target, 8);
  assert.throws(() => run(s, { type: "declareApproach", charId: "ben", suit: "D", goal: "   " }), /what you're trying/);
  // A player may suggest a difficulty; the GM's target still decides.
  ({ state: s } = run(s, { type: "declareApproach", charId: "ben", suit: "D", goal: "Pick the lock", suggested: 13 }));
  assert.equal(viewFor(s, { role: "gm" }).check.players.ben.suggested, 13);
  assert.equal(s.check.players.ben.target, null);
  ({ state: s } = run(s, { type: "setGoal", charId: "ben", target: 11 }));
  assert.equal(s.check.players.ben.target, 11);
  assert.throws(() => run(s, { type: "declareApproach", charId: "ben", suit: "D", goal: "Pick the lock", suggested: 2.5 }), /suggested target/);
});
