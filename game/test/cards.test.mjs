import test from "node:test";
import assert from "node:assert/strict";
import { buildStarter, playerCards, worldCards } from "../engine/cards.mjs";
import { createGame, apply, RuleError } from "../engine/index.mjs";

test("a player brings two standard decks: 80 ordinary cards, six of each status, four Blessed", () => {
  const all = playerCards("p");
  assert.equal(all.length, 108);
  assert.equal(all.filter((c) => !c.status && !c.blessed).length, 80);
  for (const s of ["S", "D", "I", "W"]) assert.equal(all.filter((c) => c.status && c.suit === s).length, 6);
  assert.equal(all.filter((c) => c.blessed).length, 4);
  assert.equal(new Set(all.map((c) => c.id)).size, 108);
});

test("the starter is 20 cards, two of each value, split 7/5/4/4", () => {
  const { deck, reserve } = buildStarter("p", "S", "D", ["I", "W"]);
  assert.equal(deck.length, 20);
  assert.equal(reserve.length, 88);
  for (let v = 1; v <= 10; v++) assert.equal(deck.filter((c) => c.v === v).length, 2, `value ${v}`);
  const bySuit = (s) => deck.filter((c) => c.suit === s).map((c) => c.v).sort((a, b) => a - b);
  assert.deepEqual(bySuit("S"), [1, 2, 4, 5, 7, 8, 10]);
  assert.deepEqual(bySuit("D"), [1, 3, 6, 9, 10]);
  assert.deepEqual(bySuit("I"), [2, 3, 6, 9]);
  assert.deepEqual(bySuit("W"), [4, 5, 7, 8]);
  assert.ok(deck.every((c) => !c.status && !c.blessed));
});

test("the world deck is one standard deck's A–10", () => {
  const w = worldCards();
  assert.equal(w.length, 40);
  assert.equal(new Set(w.map((c) => c.id)).size, 40);
});

test("character creation checks the suit choices", () => {
  const g = createGame({ seed: 1 });
  assert.throws(() => apply(g, { type: "createCharacter", id: "x", primary: "S", secondary: "S", others: ["I", "W"] }), RuleError);
  assert.throws(() => apply(g, { type: "createCharacter", id: "x", primary: "S", secondary: "D", others: ["I", "I"] }), RuleError);
  const { state } = apply(g, { type: "createCharacter", id: "x", name: "X", primary: "S", secondary: "D", others: ["I", "W"] });
  assert.equal(state.characters.x.deck.length, 20);
  assert.deepEqual(state.seats, ["x"]);
  assert.throws(() => apply(state, { type: "createCharacter", id: "x", primary: "S", secondary: "D", others: ["I", "W"] }), /already exists/);
});
