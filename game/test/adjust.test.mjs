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
  assert.equal(s.check.players.ana.goal, "GM's words", "the GM has the final say on the goal too");
  assert.equal(s.check.players.ana.target, 8);
  // A goal needn't be written: it can be spoken at the table or implied by the situation.
  ({ state: s } = run(s, { type: "declareApproach", charId: "ben", suit: "D", goal: "   " }));
  assert.equal(s.check.players.ben.goal, null);
  assert.equal(s.check.players.ben.approach, "D");
  // A player may suggest a difficulty; the GM's target still decides.
  ({ state: s } = run(s, { type: "declareApproach", charId: "ben", suit: "D", goal: "Pick the lock", suggested: 13 }));
  assert.equal(viewFor(s, { role: "gm" }).check.players.ben.suggested, 13);
  assert.equal(s.check.players.ben.target, null);
  ({ state: s } = run(s, { type: "setGoal", charId: "ben", target: 11 }));
  assert.equal(s.check.players.ben.target, 11);
  assert.throws(() => run(s, { type: "declareApproach", charId: "ben", suit: "D", goal: "Pick the lock", suggested: 2.5 }), /suggested target/);
});

test("GM card editing: move between deck, discard, hand and reserve; add from reserve or as an extra card", () => {
  let s = game(["ana"]);
  const ana = () => s.characters.ana;
  const deckCard = ana().deck[0];
  let events;
  // Deck to discard, then to the top of the deck (a deck's top is its last card), then removed to reserve.
  ({ state: s, events } = run(s, { type: "gmMoveCard", charId: "ana", cardId: deckCard.id, to: "discard" }));
  assert.equal(ana().discard.at(-1).id, deckCard.id);
  assert.deepEqual(events.find((e) => e.type === "gmCardMoved"), { type: "gmCardMoved", id: "ana", card: events.find((e) => e.type === "gmCardMoved").card, from: "deck", to: "discard" });
  ({ state: s } = run(s, { type: "gmMoveCard", charId: "ana", cardId: deckCard.id, to: "deck-top" }));
  assert.equal(ana().deck.at(-1).id, deckCard.id);
  ({ state: s } = run(s, { type: "gmMoveCard", charId: "ana", cardId: deckCard.id, to: "reserve" }));
  assert.ok(ana().reserve.some((c) => c.id === deckCard.id));
  assert.equal(ana().deck.length, 19);
  assert.throws(() => run(s, { type: "gmMoveCard", charId: "ana", cardId: deckCard.id, to: "hand" }), /during a check/);
  assert.throws(() => run(s, { type: "gmMoveCard", charId: "ana", cardId: "nope", to: "discard" }), /isn't in/);

  // Add from reserve: Ana starts with two 10s of her primary suit; a third comes from reserve? No: both are in her deck,
  // so a third 10 is an extra card. A Stumble and a Blessed come from reserve.
  const tens = () => [...ana().deck, ...ana().discard].filter((c) => !c.status && !c.blessed && c.suit === "S" && c.v === 10).length;
  const before = tens();
  ({ state: s, events } = run(s, { type: "gmAddCard", charId: "ana", suit: "S", v: 10, to: "deck-shuffle" }));
  assert.equal(tens(), before + 1);
  ({ state: s, events } = run(s, { type: "gmAddCard", charId: "ana", suit: "S", v: 10, to: "discard" }));
  ({ state: s, events } = run(s, { type: "gmAddCard", charId: "ana", suit: "S", v: 10, to: "discard" }));
  assert.equal(events.find((e) => e.type === "gmCardAdded").extra, true, "with every copy out, an extra card is made");
  assert.match(ana().discard.at(-1).id, /^ana\/gm\.\d+$/);
  ({ state: s } = run(s, { type: "gmAddCard", charId: "ana", kind: "status", suit: "D", to: "deck-bottom" }));
  assert.equal(ana().deck[0].status, true);
  ({ state: s } = run(s, { type: "gmAddCard", charId: "ana", kind: "blessed", to: "deck-top" }));
  assert.equal(ana().deck.at(-1).blessed, true);
  assert.throws(() => run(s, { type: "gmAddCard", charId: "ana", suit: "S", v: 11, to: "discard" }), /A to 10/);
  // The GM sees the reserve's cards, to choose from.
  assert.ok(viewFor(s, { role: "gm" }).characters.ana.reserveCards.length > 0);

  // In a check: a card from the deck into a hand; a locked card can't move.
  s = dealt(game(["ana", "ben"]));
  const card = s.characters.ana.deck[0];
  ({ state: s } = run(s, { type: "gmMoveCard", charId: "ana", cardId: card.id, to: "hand" }));
  assert.ok(hand(s, "ana").some((c) => c.id === card.id));
  const legal = s.check.players.ana.hand.find((c) => c.id === card.id && !c.status) ? card.id : null;
  if (legal) ({ state: s } = run(s, { type: "lockCard", charId: "ana", cardId: card.id }));
  else ({ state: s } = run(s, { type: "lockCard", charId: "ana", cardId: s.check.players.ana.hand.find((c) => !c.status).id }));
  const locked = s.check.locks.ana.cardId;
  assert.throws(() => run(s, { type: "gmMoveCard", charId: "ana", cardId: locked, to: "discard" }), /locked in/);
  ({ state: s } = run(s, { type: "gmShuffleDeck", charId: "ana" }));
});

test("the GM can set a participant up with no input from them: trump, goal and target", () => {
  let s = game(["ana", "ben"]);
  ({ state: s } = run(s, { type: "beginCheck", participants: ["ana", "ben"] }));
  // Ana says nothing; the GM sets her trump and target. Ben's player declares; the GM changes his trump anyway.
  ({ state: s } = run(s, { type: "setGoal", charId: "ana", suit: "W", target: 9 }));
  assert.deepEqual([s.check.players.ana.approach, s.check.players.ana.target, s.check.players.ana.approved, s.check.players.ana.goal], ["W", 9, true, null]);
  ({ state: s } = run(s, { type: "declareApproach", charId: "ben", suit: "D", goal: "Pick the lock", suggested: 11 }, { type: "setGoal", charId: "ben", target: 11 }));
  ({ state: s } = run(s, { type: "setGoal", charId: "ben", suit: "I", goal: "Talk the guard round" }));
  assert.deepEqual([s.check.players.ben.approach, s.check.players.ben.goal, s.check.players.ben.approved], ["I", "Talk the guard round", true], "changing the trump keeps the target accepted");
  assert.throws(() => run(s, { type: "setGoal", charId: "ben" }), /Set a trump, a goal or a target/);
  assert.throws(() => run(s, { type: "setGoal", charId: "ben", suit: "X" }), /trump/);
  ({ state: s } = run(s, { type: "deal" }));
  assert.equal(s.check.phase, "play");
});
