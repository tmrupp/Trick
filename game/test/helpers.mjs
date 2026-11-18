import { createGame, apply } from "../engine/index.mjs";

export const run = (state, ...actions) => {
  let events = [];
  for (const a of actions) {
    const r = apply(state, a, { inPlace: true });
    state = r.state;
    events = events.concat(r.events);
  }
  return { state, events };
};

export const PEOPLE = {
  ana: { id: "ana", name: "Ana", primary: "S", secondary: "D", others: ["I", "W"] },
  ben: { id: "ben", name: "Ben", primary: "D", secondary: "I", others: ["S", "W"] },
  cara: { id: "cara", name: "Cara", primary: "I", secondary: "W", others: ["S", "D"] },
};

export function game(ids = ["ana", "ben", "cara"], seed = "test") {
  let state = createGame({ seed });
  for (const id of ids) state = apply(state, { type: "createCharacter", ...PEOPLE[id] }, { inPlace: true }).state;
  return state;
}

// Begin and deal a check: each player states a goal (its suit defaults to their primary), then the GM sets
// the target (default 10).
export function dealt(state, { kind = "standard", ids, targets = {}, approaches = {} } = {}) {
  ids = ids || Object.keys(state.characters);
  const acts = [{ type: "beginCheck", kind, participants: ids }];
  for (const id of ids) {
    acts.push({ type: "declareApproach", charId: id, goal: "Test", suit: approaches[id] || state.characters[id].primary });
    acts.push({ type: "setGoal", charId: id, target: targets[id] ?? 10 });
  }
  acts.push({ type: "deal" });
  let s = state;
  for (const a of acts) {
    if (a.type === "setGoal" && s.check && s.check.players[a.charId] && s.check.players[a.charId].survival) a.target = s.check.players[a.charId].target;
    s = apply(s, a, { inPlace: true }).state;
  }
  return s;
}

// A test card: "S7" is the 7 of Strength, "Dx" a Stumble, "B" a Blessed.
let n = 0;
export function card(spec, owner = "t") {
  n++;
  if (spec === "B") return { id: `${owner}/B.t${n}`, owner, v: 0, blessed: true };
  const suit = spec[0];
  if (spec[1] === "x") return { id: `${owner}/${suit}x.t${n}`, owner, suit, v: 0, status: true };
  return { id: `${owner}/${spec}.t${n}`, owner, suit, v: Number(spec.slice(1)) };
}

// Replace the world row from the current trick on, and set hands, for a rules scenario.
export function rig(state, { row, hands = {}, worldDeck }) {
  const ck = state.check;
  if (row) row.forEach((spec, i) => { ck.worldRow[ck.trick + i] = card(spec, "world"); });
  if (worldDeck) ck.worldDeck = worldDeck.map((spec) => card(spec, "world"));
  for (const [id, specs] of Object.entries(hands)) ck.players[id].hand = specs.map((s) => card(s, id));
  return state;
}

export const hand = (state, id) => state.check.players[id].hand;
export const find = (state, id, spec) => {
  const suit = spec[0];
  return hand(state, id).find((c) => (spec === "B" ? c.blessed : spec[1] === "x" ? c.status && c.suit === suit : !c.status && !c.blessed && c.suit === suit && c.v === Number(spec.slice(1))));
};
export const lock = (state, id, spec, priceSpec) => ({
  type: "lockCard", charId: id, cardId: find(state, id, spec).id, priceCardId: priceSpec ? find(state, id, priceSpec).id : undefined,
});
