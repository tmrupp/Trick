import test from "node:test";
import assert from "node:assert/strict";
import { trickWinner, legalCards, RuleError } from "../engine/index.mjs";
import { game, dealt, rig, run, lock, find, hand, card } from "./helpers.mjs";

const W = (spec) => card(spec, "world");
const play = (id, spec, approach, brace = 0) => {
  const c = card(spec, id);
  const w = play.world;
  return { id, card: c, approach, bv: c.blessed ? null : c.v + brace, onSuit: !c.blessed && (c.suit === approach || c.suit === w.suit) };
};
const winnerOf = (world, plays) => { play.world = world; const r = trickWinner(world, plays.map((f) => f())); return r; };

test("the single highest on-suit card wins", () => {
  const w = W("S5");
  const r = winnerOf(w, [() => play("ana", "S7", "S"), () => play("ben", "D3", "D")]);
  assert.equal(r.winner.id, "ana");
  assert.equal(r.reason, "highest");
});

test("a card in its owner's trump wins off the world card's suit", () => {
  const w = W("S5");
  const r = winnerOf(w, [() => play("ben", "D8", "D"), () => play("ana", "S6", "S")]);
  assert.equal(r.winner.id, "ben");
});

test("a high off-suit card blocks: the world takes the trick", () => {
  const w = W("S5");
  const r = winnerOf(w, [() => play("ana", "S7", "S"), () => play("ben", "I9", "D")]);
  assert.equal(r.winner, null);
  assert.equal(r.reason, "blocked");
  assert.equal(r.by.id, "ben");
});

test("the world takes the trick when its card is highest, or level with the best play", () => {
  const w = W("S8");
  assert.equal(winnerOf(w, [() => play("ana", "S7", "S")]).reason, "worldHighest");
  assert.equal(winnerOf(w, [() => play("ana", "S8", "S")]).reason, "worldHighest");
});

test("ties: world suit and own trump beats world suit only, which beats trump only", () => {
  const w = W("S5");
  let r = winnerOf(w, [() => play("ana", "S7", "S"), () => play("cara", "S7", "I")]);
  assert.equal(r.winner.id, "ana");
  assert.equal(r.reason, "tieBreak");
  r = winnerOf(w, [() => play("cara", "S7", "I"), () => play("ben", "D7", "D")]);
  assert.equal(r.winner.id, "cara");
});

test("a tie that stays level, or that includes an off-suit card, goes to the world", () => {
  const w = W("S5");
  assert.equal(winnerOf(w, [() => play("ana", "S7", "S"), () => play("x", "S7", "S")]).reason, "tieLevel");
  assert.equal(winnerOf(w, [() => play("ana", "S7", "S"), () => play("ben", "I7", "D")]).reason, "blocked");
});

test("Brace counts for beating", () => {
  const w = W("S8");
  const r = winnerOf(w, [() => play("ana", "S5", "S", 4)]);
  assert.equal(r.winner.id, "ana");
});

test("Blessed always takes the trick; two Blessed tie and the world takes it", () => {
  const w = W("S10");
  assert.equal(winnerOf(w, [() => play("ana", "B", "S"), () => play("ben", "S9", "D")]).winner.id, "ana");
  assert.equal(winnerOf(w, [() => play("ana", "B", "S"), () => play("ben", "B", "D")]).reason, "blessedTie");
});

test("a whole trick: the winner scores the world card's value, losers take consolations", () => {
  let s = dealt(game());
  rig(s, { row: ["S5", "S9"], hands: { ana: ["S7", "S4"], ben: ["S2", "D1"], cara: ["W3", "I1"] } });
  ({ state: s } = run(s, lock(s, "ana", "S7"), lock(s, "ben", "S2"), lock(s, "cara", "W3")));
  const ck = s.check;
  assert.equal(ck.players.ana.tally[0].score, 5);
  assert.equal(ck.players.ben.brace, 2, "a losing Heart Braces");
  assert.equal(ck.players.cara.mirror, true, "a losing Club Mirrors");
  assert.equal(ck.trick, 1);
  assert.equal(ck.phase, "play");
  assert.equal(ck.players.ana.played.length, 1, "played cards stay in the row until cleanup");
});

test("Mirror: the next winning card scores 11 minus the world card", () => {
  let s = dealt(game());
  rig(s, { row: ["W5", "W2"], hands: { ana: ["S1", "S2"], ben: ["D1", "D2"], cara: ["W3", "W9"] } });
  ({ state: s } = run(s, lock(s, "ana", "S1"), lock(s, "ben", "D1"), lock(s, "cara", "W3")));
  assert.equal(s.check.players.cara.mirror, true);
  s.check.pending = []; // skip Ben's Peek
  s.check.phase = "play";
  ({ state: s } = run(s, lock(s, "ana", "S2"), lock(s, "ben", "D2"), lock(s, "cara", "W9")));
  assert.equal(s.check.players.cara.tally[0].score, 9);
  assert.equal(s.check.players.cara.tally[0].mirrored, true);
});

test("a status in the world card's suit must be played", () => {
  let s = dealt(game());
  rig(s, { row: ["S5"], hands: { ana: ["Sx", "S9"], ben: ["D1"], cara: ["I1"] } });
  assert.deepEqual(legalCards(s, "ana"), [find(s, "ana", "Sx").id]);
  assert.throws(() => run(s, lock(s, "ana", "S9")), /must play your Injury/);
  assert.deepEqual(legalCards(s, "ben").length, 1);
});

test("Stumble's Price: playing Stumble discards an ordinary card of your choice", () => {
  let s = dealt(game());
  rig(s, { row: ["D5", "S1"], hands: { ana: ["S1", "S2"], ben: ["Dx", "D7", "I4"], cara: ["I1", "I2"] } });
  assert.throws(() => run(s, lock(s, "ben", "Dx")), /Price/);
  const discardBefore = s.characters.ben.discard.length;
  ({ state: s } = run(s, lock(s, "ben", "Dx", "I4"), lock(s, "ana", "S1"), lock(s, "cara", "I1")));
  assert.equal(s.characters.ben.discard.length, discardBefore + 1);
  assert.equal(s.characters.ben.discard.at(-1).v, 4);
  assert.equal(hand(s, "ben").length, 1);
});

test("Peek: swap the world deck's top card in; the old card goes to the bottom", () => {
  let s = dealt(game());
  rig(s, { row: ["S9", "I8"], hands: { ana: ["D1", "S2"], ben: ["D2", "D3"], cara: ["I1", "I2"] }, worldDeck: ["W1", "S6", "S4"] });
  ({ state: s } = run(s, lock(s, "ana", "D1"), lock(s, "ben", "D2"), lock(s, "cara", "I1")));
  const ck = s.check;
  assert.equal(ck.phase, "consolation");
  assert.deepEqual(ck.pending.filter((x) => x.type === "peek").map((x) => x.charId), ["ana", "ben"], "Peeks go clockwise from the GM");
  assert.throws(() => run(s, { type: "peek", charId: "ben", swap: true }), /isn't your Peek/);
  ({ state: s } = run(s, { type: "peek", charId: "ana", swap: true }));
  assert.equal(s.check.worldRow[1].suit, "S");
  assert.equal(s.check.worldRow[1].v, 4);
  assert.equal(s.check.worldDeck[0].v, 8, "the replaced card is at the bottom");
  ({ state: s } = run(s, { type: "peek", charId: "ben", swap: false }));
  // Cara's Recalculate still waits.
  assert.equal(s.check.phase, "consolation");
  ({ state: s } = run(s, { type: "recalculate", charId: "cara", cardId: find(s, "cara", "I2").id }));
  assert.equal(s.check.phase, "play");
  assert.equal(hand(s, "cara").length, 1, "Recalculate discards one and draws one");
});

test("no consolations after the final trick", () => {
  let s = dealt(game());
  s.check.trick = s.check.tricks - 1;
  rig(s, { row: ["S9"], hands: { ana: ["D1"], ben: ["S2"], cara: ["I1"] } });
  ({ state: s } = run(s, lock(s, "ana", "D1"), lock(s, "ben", "S2"), lock(s, "cara", "I1")));
  assert.equal(s.check.phase, "resolve");
  assert.equal(s.check.pending.length, 0);
  assert.equal(s.check.players.ben.brace, 0);
});

test("a player with an empty hand sits out", () => {
  let s = dealt(game());
  rig(s, { row: ["S5"], hands: { ana: ["S7", "S1"], ben: [], cara: ["I1", "I2"] } });
  ({ state: s } = run(s, lock(s, "ana", "S7"), lock(s, "cara", "I1")));
  assert.equal(s.check.trick, 1);
  assert.equal(s.check.players.ana.tally.length, 1);
});

test("a card can be unlocked until everyone has locked", () => {
  let s = dealt(game());
  rig(s, { row: ["S5"], hands: { ana: ["S7", "S1"], ben: ["D1"], cara: ["I1"] } });
  ({ state: s } = run(s, lock(s, "ana", "S7"), { type: "unlockCard", charId: "ana" }, lock(s, "ana", "S1"), lock(s, "ben", "D1"), lock(s, "cara", "I1")));
  assert.equal(s.check.players.ana.tally.length, 0);
  assert.throws(() => run(s, { type: "lockCard", charId: "ana", cardId: "nope" }), RuleError);
});

test("Blessed: granted to the top of the deck, given between tricks, and returned to reserve when played", () => {
  let s = game();
  ({ state: s } = run(s, { type: "grantBlessed", charId: "ana" }));
  assert.ok(s.characters.ana.deck.at(-1).blessed);
  s = dealt(s);
  assert.ok(hand(s, "ana").some((c) => c.blessed), "drawn first");
  const reserveBefore = s.characters.ana.reserve.length;
  const b = find(s, "ana", "B");
  const handBefore = hand(s, "ana").length;
  ({ state: s } = run(s, { type: "giveBlessed", charId: "ana", to: "ben", cardId: b.id }));
  assert.ok(hand(s, "ben").some((c) => c.blessed));
  assert.equal(hand(s, "ana").length, handBefore, "the giver draws one");
  rig(s, { row: ["S10"] });
  const ben = hand(s, "ben").find((c) => c.blessed);
  ({ state: s } = run(s,
    { type: "lockCard", charId: "ana", cardId: hand(s, "ana").find((c) => !(c.status && c.suit === "S")).id },
    { type: "lockCard", charId: "ben", cardId: ben.id },
    { type: "lockCard", charId: "cara", cardId: hand(s, "cara").find((c) => !(c.status && c.suit === "S")).id }));
  assert.equal(s.check.log[0].winner, "ben");
  assert.equal(s.check.log[0].reason, "blessed");
  assert.equal(s.characters.ana.reserve.length, reserveBefore + 1, "Ana's Blessed went back to her reserve");
  assert.ok(s.characters.ana.reserve.some((c) => c.id === ben.id));
});
