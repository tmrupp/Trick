import test from "node:test";
import assert from "node:assert/strict";
import { viewFor, countsNow, trickWinner } from "../engine/index.mjs";
import { game, dealt, rig, run, lock, hand } from "./helpers.mjs";

const allCardIds = (ch, p = null) => [
  ...ch.deck, ...ch.discard, ...ch.reserve,
  ...(ch.items || []).flatMap((it) => it.tucked || []),
  ...(p ? [...p.hand, ...p.played, ...(p.aside || []).map((a) => a.card)] : []),
].map((c) => c.id).sort();

test("rich items: stacking, charges, notes, custom items, and relic price reveal", () => {
  let s = game(["ana"]);
  let events;
  // Stackable seeds
  ({ state: s } = run(s, { type: "giveItem", charId: "ana", itemId: "iron-apple-seed", qty: 4 }));
  ({ state: s } = run(s, { type: "giveItem", charId: "ana", itemId: "iron-apple-seed", qty: 2 }));
  assert.equal(s.characters.ana.items.length, 1);
  assert.equal(s.characters.ana.items[0].qty, 6);
  // Decrement by 1 keeps item
  ({ state: s } = run(s, { type: "loseItem", charId: "ana", itemId: "iron-apple-seed", qty: 1 }));
  assert.equal(s.characters.ana.items[0].qty, 5);
  // Custom homebrew item
  ({ state: s } = run(s, { type: "giveItem", charId: "ana", label: "Brass Compass", text: "Points to what you fear most." }));
  const compass = s.characters.ana.items.find((x) => x.label === "Brass Compass");
  assert.ok(compass && compass.itemId === null);
  ({ state: s } = run(s, { type: "updateItem", charId: "ana", instanceId: compass.id, charges: 3, note: "Warm in the cellar" }));
  assert.equal(s.characters.ana.items.find((x) => x.id === compass.id).charges, 3);
  assert.equal(s.characters.ana.items.find((x) => x.id === compass.id).note, "Warm in the cellar");
  // Relic price reveal
  ({ state: s } = run(s, { type: "giveItem", charId: "ana", itemId: "grave-sledge" }));
  const sledge = s.characters.ana.items.find((x) => x.itemId === "grave-sledge");
  assert.equal(sledge.revealed, false);
  ({ state: s, events } = run(s, { type: "revealItemPrice", charId: "ana", instanceId: sledge.id }));
  assert.equal(events[0].type, "itemPriceRevealed");
  assert.equal(s.characters.ana.items.find((x) => x.id === sledge.id).revealed, true);
  assert.equal(viewFor(s, { role: "player", charId: "ana" }).characters.ana.items.find((x) => x.id === sledge.id).revealed, true);
});

test("tucking cards under items preserves card count and hides private card details from other seats", () => {
  let s = game(["ana", "ben"]);
  const before = allCardIds(s.characters.ana);
  ({ state: s } = run(s, { type: "giveItem", charId: "ana", itemId: "grave-sledge" }));
  const sledge = s.characters.ana.items[0];
  const card = s.characters.ana.deck[0];
  ({ state: s } = run(s, { type: "gmTuckCard", charId: "ana", instanceId: sledge.id, cardId: card.id }));
  assert.deepEqual(allCardIds(s.characters.ana), before);
  assert.equal(s.characters.ana.items[0].tucked.length, 1);
  // Private journal check: Ben & table must not see cardTucked
  assert.equal(viewFor(s, { role: "table" }).journal.some((e) => e.type === "cardTucked"), false);
  assert.equal(viewFor(s, { role: "player", charId: "ben" }).journal.some((e) => e.type === "cardTucked"), false);
  assert.equal(viewFor(s, { role: "player", charId: "ana" }).journal.some((e) => e.type === "cardTucked"), true);
  // Losing the item returns tucked cards to discard!
  ({ state: s } = run(s, { type: "loseItem", charId: "ana", instanceId: sledge.id }));
  assert.deepEqual(allCardIds(s.characters.ana), before);
  assert.ok(s.characters.ana.discard.some((c) => c.id === card.id));
});

test("gmSwapPools swaps complete personal card pools between checks only", () => {
  let s = game(["ana", "ben"]);
  const anaBefore = allCardIds(s.characters.ana);
  const benBefore = allCardIds(s.characters.ben);
  ({ state: s } = run(s, { type: "gmSwapPools", charA: "ana", charB: "ben" }));
  assert.deepEqual(allCardIds(s.characters.ana), benBefore);
  assert.deepEqual(allCardIds(s.characters.ben), anaBefore);
  // Forbidden during a check
  let c = dealt(s, ["ana", "ben"]);
  assert.throws(() => run(c, { type: "gmSwapPools", charA: "ana", charB: "ben" }), /between checks/);
});

test("set aside: privacy for face-down cards, Red Thread return bonus, and cleanup back to discard", () => {
  let s = dealt(game(["ana", "ben"]));
  rig(s, { row: ["S5", "S6", "S7"], hands: { ana: ["S4", "D3", "I2"], ben: ["S2", "D1", "I1"] } });
  const before = allCardIds(s.characters.ana, s.check.players.ana);
  const d3 = hand(s, "ana").find((c) => c.suit === "D" && c.v === 3);
  const i2 = hand(s, "ana").find((c) => c.suit === "I" && c.v === 2);
  // Set D3 aside face-up, I2 aside face-down
  ({ state: s } = run(s, { type: "gmSetAside", charId: "ana", cardId: d3.id, faceUp: true }));
  ({ state: s } = run(s, { type: "gmSetAside", charId: "ana", cardId: i2.id, faceUp: false }));
  assert.deepEqual(allCardIds(s.characters.ana, s.check.players.ana), before);
  // Table sees face-up card, hides face-down card
  const tblAside = viewFor(s, { role: "table" }).check.players.ana.aside;
  assert.equal(tblAside[0].card.id, d3.id);
  assert.equal(tblAside[1].card, null);
  // Owner sees both
  const anaAside = viewFor(s, { role: "player", charId: "ana" }).check.players.ana.aside;
  assert.equal(anaAside[1].card.id, i2.id);
  // Play trick 0 (Ana loses S4 to S5 -> gains Brace +4), then tug D3 back with +1 Red Thread bonus
  ({ state: s } = run(s, lock(s, "ana", "S4"), lock(s, "ben", "S2")));
  ({ state: s } = run(s, { type: "gmReturnAside", charId: "ana", cardId: d3.id, to: "hand", beatDelta: 1 }));
  const returned = hand(s, "ana").find((c) => c.id === d3.id);
  assert.equal(returned.beatDelta, 1);
  assert.equal(countsNow(returned, s.check.players.ana), 8, "3 printed + 1 Red Thread + 4 Brace");
  // End check after remaining tricks: remaining aside card (I2) goes to discard
  ({ state: s } = run(s, { type: "gmSitOut", charId: "ana", sitOut: true }, { type: "gmSitOut", charId: "ben", sitOut: true }));
  assert.equal(s.check.phase, "resolve");
  ({ state: s } = run(s, { type: "endCheck" }));
  assert.deepEqual(allCardIds(s.characters.ana), before);
  assert.ok(s.characters.ana.discard.some((c) => c.id === i2.id));
});

test("pinned card returns straight to hand when played and gives no consolation (Grave Sledge)", () => {
  let s = dealt(game(["ana", "ben"]));
  rig(s, { row: ["S9", "D5"], hands: { ana: ["S4", "I2"], ben: ["D1", "I1"] } });
  const s4 = hand(s, "ana").find((c) => c.suit === "S" && c.v === 4);
  ({ state: s } = run(s, { type: "gmPinCard", charId: "ana", cardId: s4.id, pinned: true }));
  // Ana loses trick 0 with pinned S4 — must return to hand and NOT grant Brace!
  ({ state: s } = run(s, lock(s, "ana", "S4"), lock(s, "ben", "D1")));
  assert.ok(hand(s, "ana").some((c) => c.id === s4.id), "pinned card stays in hand");
  assert.equal(s.check.players.ana.played.some((c) => c.id === s4.id), false);
  assert.equal(s.check.players.ana.brace, 0, "pinned card gives no consolation");
});

test("countsNow & check card rules: Grip Bone setValue, Iron Apple minValue, Iron Apple Seed multNext", () => {
  let s = dealt(game(["ana", "ben"]));
  rig(s, { row: ["S8", "S9", "S9"], hands: { ana: ["S3", "S4", "D3"], ben: ["I1", "I2", "I3"] } });
  // Grip Bone: 3s count as 10
  ({ state: s } = run(s, { type: "gmCheckCardRule", charId: "ana", kind: "setValue", matchValue: 3, to: 10 }));
  assert.equal(countsNow(hand(s, "ana").find((c) => c.suit === "S" && c.v === 3), s.check.players.ana), 10);
  assert.equal(countsNow(hand(s, "ana").find((c) => c.suit === "D" && c.v === 3), s.check.players.ana), 10);
  // Clear and test Iron Apple minValue (Strength < 5 counts 5) + Iron Apple Seed multNext (next Strength ×2)
  ({ state: s } = run(s, { type: "gmClearCardRules", charId: "ana" }));
  ({ state: s } = run(s, { type: "gmCheckCardRule", charId: "ana", kind: "minValue", suit: "S", min: 5, ordinaryOnly: true }));
  ({ state: s } = run(s, { type: "gmCheckCardRule", charId: "ana", kind: "multNext", suit: "S", mult: 2 }));
  // S3 -> min 5 -> ×2 = 10 beats S8!
  assert.equal(countsNow(hand(s, "ana").find((c) => c.suit === "S" && c.v === 3), s.check.players.ana), 10);
  ({ state: s } = run(s, lock(s, "ana", "S3"), lock(s, "ben", "I1")));
  assert.equal(s.check.log[0].winner, "ana");
  // multNext is consumed, minValue remains! So S4 now counts 5 (not 10).
  assert.equal(countsNow(hand(s, "ana").find((c) => c.suit === "S" && c.v === 4), s.check.players.ana), 5);
});

test("gmSetConsolation transfers Brace cleanly (Porter's Rope)", () => {
  let s = dealt(game(["ana", "ben"]));
  rig(s, { row: ["S9", "D7"], hands: { ana: ["S6", "I2"], ben: ["D2", "I1"] } });
  ({ state: s } = run(s, lock(s, "ana", "S6"), lock(s, "ben", "I1")));
  assert.equal(s.check.players.ana.brace, 6);
  ({ state: s } = run(s,
    { type: "gmSetConsolation", charId: "ana", brace: 0, reason: "Porter's Rope" },
    { type: "gmSetConsolation", charId: "ben", brace: 6, reason: "Porter's Rope" },
  ));
  assert.equal(s.check.players.ana.brace, 0);
  assert.equal(s.check.players.ben.brace, 6);
  assert.equal(countsNow(hand(s, "ben").find((c) => c.suit === "D" && c.v === 2), s.check.players.ben), 8);
});

test("trick modifiers: worldCannotWin (Black Wedge) and invert (Borrowed Face)", () => {
  // worldCannotWin: world 10 loses to on-suit 2; off-suit only -> nobody takes it and worldTaken stays empty
  const w10 = { suit: "S", v: 10, worldCannotWin: true };
  const r1 = trickWinner(w10, [{ id: "ana", card: { suit: "S", v: 2 }, bv: 2, onSuit: true, approach: "D" }]);
  assert.equal(r1.winner.id, "ana");
  assert.equal(r1.reason, "worldCannotWin");
  const r2 = trickWinner(w10, [{ id: "ana", card: { suit: "I", v: 9 }, bv: 9, onSuit: false, approach: "D" }]);
  assert.equal(r2.winner, null);
  assert.equal(r2.reason, "noOnSuit");

  // invert: lowest card of world's suit under world card wins; trump does not apply
  const wInv = { suit: "D", v: 7, invert: true };
  const r3 = trickWinner(wInv, [
    { id: "ana", card: { suit: "S", v: 1 }, bv: 1, onSuit: true, approach: "S" }, // trump, wrong suit -> ignored
    { id: "ben", card: { suit: "D", v: 5 }, bv: 5, onSuit: true, approach: "S" },
    { id: "cara", card: { suit: "D", v: 2 }, bv: 2, onSuit: true, approach: "S" },
  ]);
  assert.equal(r3.winner.id, "cara");
  assert.equal(r3.reason, "inverted");
  const r4 = trickWinner(wInv, [{ id: "ana", card: { suit: "D", v: 8 }, bv: 8, onSuit: true, approach: "D" }]);
  assert.equal(r4.winner, null);
  assert.equal(r4.reason, "worldInverted");

  // End-to-end check with gmSetTrickMod(worldCannotWin) and nobody on-suit leaves worldTaken empty
  let s = dealt(game(["ana", "ben"]));
  rig(s, { row: ["S10", "S5"], hands: { ana: ["I2", "S6"], ben: ["I3", "S4"] } });
  s.check.players.ana.approach = "D";
  s.check.players.ben.approach = "W";
  ({ state: s } = run(s, { type: "gmSetTrickMod", index: 0, worldCannotWin: true }));
  ({ state: s } = run(s, lock(s, "ana", "I2"), lock(s, "ben", "I3")));
  assert.equal(s.check.log[0].winner, null);
  assert.equal(s.check.log[0].reason, "noOnSuit");
  assert.equal(s.check.worldTaken.length, 0);
});

test("gmLockRandom locks random legal cards and resolves trick when all locked (Hushbell Chain)", () => {
  let s = dealt(game(["ana", "ben"]));
  rig(s, { row: ["S5", "D5"], hands: { ana: ["S7", "I2"], ben: ["D2", "I1"] } });
  ({ state: s } = run(s, lock(s, "ana", "S7")));
  ({ state: s } = run(s, { type: "gmLockRandom", charIds: ["ben"], reason: "Hushbell Chain" }));
  assert.equal(s.check.log.length, 1);
  assert.equal(s.check.log[0].winner, "ana");
});

test("private deck peek works between checks and mid-check without leaking to other seats (Ripped Page)", () => {
  let s = game(["ana", "ben"]);
  const before = allCardIds(s.characters.ana);
  const top3Before = s.characters.ana.deck.slice(-3).reverse().map((c) => c.id);
  ({ state: s } = run(s, { type: "gmPeekDeck", charId: "ana", n: 3, allowDiscard: true }));
  // Privacy: Ana & GM see the 3 cards; Ben & table do NOT
  const anaView = viewFor(s, { role: "player", charId: "ana" });
  const benView = viewFor(s, { role: "player", charId: "ben" });
  const tableView = viewFor(s, { role: "table" });
  const gmView = viewFor(s, { role: "gm" });
  assert.deepEqual(anaView.prompts[0].cards.map((c) => c.id), top3Before);
  assert.equal(gmView.pending[0].cards.length, 3);
  assert.equal(benView.prompts.length, 0);
  assert.equal(tableView.prompts, undefined);
  // Reorder: put top3Before[2] on top, keep top3Before[0] second, discard top3Before[1]
  ({ state: s } = run(s, { type: "resolvePeekDeck", charId: "ana", keepOrder: [top3Before[2], top3Before[0]], discard: [top3Before[1]] }));
  assert.deepEqual(allCardIds(s.characters.ana), before);
  assert.equal(s.characters.ana.deck[s.characters.ana.deck.length - 1].id, top3Before[2]);
  assert.equal(s.characters.ana.deck[s.characters.ana.deck.length - 2].id, top3Before[0]);
  assert.ok(s.characters.ana.discard.some((c) => c.id === top3Before[1]));
});

test("private world deck peek swaps into world row without leaking to other seats (Afterimage Lens)", () => {
  let s = dealt(game(["ana", "ben"]));
  const top3 = s.check.worldDeck.slice(-3).reverse().map((c) => c.id);
  const oldRow0 = s.check.worldRow[0].id;
  ({ state: s } = run(s, { type: "gmPeekWorld", charId: "ana", n: 3 }));
  assert.deepEqual(viewFor(s, { role: "player", charId: "ana" }).prompts[0].cards.map((c) => c.id), top3);
  assert.equal(viewFor(s, { role: "player", charId: "ben" }).prompts.length, 0);
  assert.equal(viewFor(s, { role: "table" }).prompts, undefined);
  // Swap top3[1] into worldRow[0]
  ({ state: s } = run(s, { type: "resolvePeekWorld", charId: "ana", swapWorldId: top3[1], rowIndex: 0 }));
  assert.equal(s.check.worldRow[0].id, top3[1]);
  assert.ok(s.check.worldDeck.some((c) => c.id === oldRow0));
  assert.equal(s.check.pending.length, 0);
});

test("Relic Prices: the served catalog has no Price text; the view gives it to the GM, and to others once revealed", async () => {
  const { loadItemCatalog } = await import("../server/items.mjs");
  const { prices, script } = loadItemCatalog(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  assert.ok(prices["grave-sledge"].some((l) => /Price:/.test(l)));
  assert.ok(!/Price:/.test(script), "no Price card's text reaches the pages");
  let s = game(["ana", "ben"]);
  ({ state: s } = run(s, { type: "giveItem", charId: "ana", itemId: "grave-sledge" }));
  const opts = { itemPrices: prices };
  assert.ok(viewFor(s, { role: "gm" }, opts).itemPrices["grave-sledge"]);
  for (const who of [{ role: "player", charId: "ana" }, { role: "player", charId: "ben" }, { role: "table" }]) {
    assert.equal(viewFor(s, who, opts).itemPrices["grave-sledge"], undefined, `${who.charId || who.role} sees no hidden Price`);
  }
  const id = s.characters.ana.items[0].id;
  ({ state: s } = run(s, { type: "revealItemPrice", charId: "ana", instanceId: id }));
  assert.deepEqual(viewFor(s, { role: "table" }, opts).itemPrices["grave-sledge"], prices["grave-sledge"]);
  // The GM can hide it again.
  ({ state: s } = run(s, { type: "updateItem", charId: "ana", instanceId: id, revealed: false }));
  assert.equal(s.characters.ana.items[0].revealed, false);
  assert.equal(viewFor(s, { role: "player", charId: "ana" }, opts).itemPrices["grave-sledge"], undefined);
});

test("hidden cards stay unnamed: face-down set-aside returns, value changes and face-down tucks", () => {
  let s = dealt(game(["ana", "ben"]));
  const [a, b] = s.check.players.ana.hand;
  let events;
  ({ state: s } = run(s, { type: "gmSetAside", charId: "ana", cardId: a.id, faceUp: false }));
  ({ state: s, events } = run(s, { type: "gmReturnAside", charId: "ana", cardId: a.id, to: "hand" }));
  assert.equal(events.find((e) => e.type === "asideReturned").card, null);
  ({ state: s, events } = run(s, { type: "gmCardValue", charId: "ana", cardId: b.id, beatDelta: 2 }));
  assert.equal(events.find((e) => e.type === "cardValueSet").card, null);
  // Tucked beneath an item: face down by default, so only Ana and the GM see which card.
  let t = game(["ana", "ben"]);
  ({ state: t } = run(t, { type: "giveItem", charId: "ana", itemId: "grave-sledge" }));
  const card = t.characters.ana.deck[0];
  ({ state: t } = run(t, { type: "gmTuckCard", charId: "ana", itemId: "grave-sledge", cardId: card.id }));
  assert.deepEqual(viewFor(t, { role: "player", charId: "ben" }).characters.ana.items[0].tucked, [null]);
  assert.deepEqual(viewFor(t, { role: "table" }).characters.ana.items[0].tucked, [null]);
  assert.equal(viewFor(t, { role: "player", charId: "ana" }).characters.ana.items[0].tucked[0].id, card.id);
  assert.equal(viewFor(t, { role: "gm" }).characters.ana.items[0].tucked[0].id, card.id);
  // Face up (the Wake Lantern's world cards are tucked face up), everyone sees it.
  const up = t.characters.ana.deck[0];
  ({ state: t } = run(t, { type: "gmTuckCard", charId: "ana", itemId: "grave-sledge", cardId: up.id, faceUp: true }));
  assert.equal(viewFor(t, { role: "table" }).characters.ana.items[0].tucked[1].id, up.id);
  ({ state: t } = run(t, { type: "gmUntuckCard", charId: "ana", itemId: "grave-sledge", cardId: up.id, to: "discard" }));
  assert.equal(t.characters.ana.discard.at(-1).tuckFaceUp, undefined);
});

test("a random lock (Hushbell Chain) is binding: it replaces a chosen card, and only the GM can undo it", async () => {
  const { authorize } = await import("../server/room.mjs");
  let s = dealt(game(["ana", "ben", "cara"]));
  rig(s, { row: ["S5", "D5"], hands: { ana: ["S7", "I2"], ben: ["D2", "I1"], cara: ["W2", "W3"] } });
  ({ state: s } = run(s, lock(s, "ben", "D2")));
  ({ state: s } = run(s, { type: "gmLockRandom", charIds: ["ben", "cara"] }));
  assert.ok(s.check.locks.ben.random && s.check.locks.cara.random, "Ben's own choice was replaced");
  assert.throws(() => run(s, { type: "unlockCard", charId: "ben" }), /locked at random/);
  assert.throws(() => run(s, lock(s, "ben", "I1")), /locked at random/);
  assert.throws(() => authorize({ role: "player", charId: "ben" }, { type: "unlockCard", charId: "ben", force: true }), /Only the GM/);
  ({ state: s } = run(s, { type: "unlockCard", charId: "ben", force: true }));
  assert.equal(s.check.locks.ben, undefined);
});

test("a deck peek between checks must be answered before a check, and still resolves after cards move", () => {
  let s = game(["ana", "ben"]);
  ({ state: s } = run(s, { type: "gmPeekDeck", charId: "ana", n: 3 }));
  assert.throws(() => run(s, { type: "beginCheck", participants: ["ana", "ben"] }), /deck peek is still open/);
  const [top, second, third] = s.betweenPending[0].cards;
  ({ state: s } = run(s, { type: "gmMoveCard", charId: "ana", cardId: second, to: "discard" }));
  ({ state: s } = run(s, { type: "resolvePeekDeck", charId: "ana", keepOrder: [third, top], discard: [] }));
  assert.equal(s.betweenPending.length, 0);
  assert.equal(s.characters.ana.deck.at(-1).id, third);
  ({ state: s } = run(s, { type: "beginCheck", participants: ["ana", "ben"] }));
});

test("swapping card pools rehomes the cards: a played Blessed returns to the reserve of the pool it is in", () => {
  let s = game(["ana", "ben"]);
  ({ state: s } = run(s, { type: "grantBlessed", charId: "ana" }, { type: "gmSwapPools", charA: "ana", charB: "ben" }));
  for (const id of ["ana", "ben"]) {
    const ch = s.characters[id];
    assert.ok([...ch.deck, ...ch.discard, ...ch.reserve].every((c) => c.owner === id), `${id}'s pool names ${id}`);
  }
  assert.ok(s.characters.ben.deck.some((c) => c.blessed && c.owner === "ben"));
});

test("older saves' bare item ids: actions upgrade them, a duplicate is refused, and the view shows instances", () => {
  let s = game(["ana"]);
  s.characters.ana.items = ["black-wedge"];
  assert.equal(viewFor(s, { role: "table" }).characters.ana.items[0].itemId, "black-wedge");
  assert.throws(() => run(s, { type: "giveItem", charId: "ana", itemId: "black-wedge" }), /already has that item/);
  ({ state: s } = run(s, { type: "useItem", charId: "ana", itemId: "black-wedge" }));
  assert.equal(typeof s.characters.ana.items[0], "object");
  ({ state: s } = run(s, { type: "loseItem", charId: "ana", itemId: "black-wedge" }));
  assert.equal(s.characters.ana.items.length, 0);
});
