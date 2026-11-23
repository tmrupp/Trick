// Cards, suits and decks, as RULES.md defines them.
// A card is plain data: { id, owner, suit, v } for an ordinary card, plus status: true or blessed: true.
// Piles are arrays whose top is the LAST element: a deck draws with pop(), a discard's top card is its last.

export const SUITS = ["S", "D", "I", "W"];

export const SUIT_INFO = {
  S: { name: "Strength", standard: "Hearts", symbol: "♥", status: "Injury", consolation: "Brace" },
  D: { name: "Dexterity", standard: "Spades", symbol: "♠", status: "Stumble", consolation: "Shave" },
  I: { name: "Intelligence", standard: "Diamonds", symbol: "♦", status: "Stress", consolation: "Recalculate" },
  W: { name: "Weird", standard: "Clubs", symbol: "♣", status: "Curse", consolation: "Mirror" },
};

// The starter deck: two of each value A–10, spread across the suits.
export const STARTER = {
  primary: [1, 2, 4, 5, 7, 8, 10],
  secondary: [1, 3, 6, 9, 10],
  others: [[2, 3, 6, 9], [4, 5, 7, 8]],
};

export const STATUSES_PER_SUIT = 6; // J, Q, K from each of two decks
export const BLESSED_PER_PLAYER = 4; // two jokers from each of two decks

export const isStatus = (c) => !!c && c.status === true;
export const isBlessed = (c) => !!c && c.blessed === true;
export const isOrdinary = (c) => !!c && !c.status && !c.blessed;

// What a card counts for beating, before Brace and adjustments. Mirror turns an ordinary card's value
// into 11 minus it (a 2 counts 9); statuses stay at 0.
export const countsAs = (c, mirror) => (mirror && isOrdinary(c) ? 11 - c.v : c.v);

// Effective beating value of a card right now, accounting for per-card overrides, check-scoped card rules
// (from items/peoples), Mirror, per-card delta, Brace, and GM boost. Shared by engine, bots, and browser UI.
export function countsNow(c, p = {}) {
  if (!c || isBlessed(c)) return null;
  let base = c.beat != null ? c.beat : countsAs(c, p.mirror);
  for (const r of p.cardRules || []) {
    if (r.kind === "setValue" && isOrdinary(c) && c.v === r.matchValue) base = r.to;
    else if (r.kind === "minValue" && (!r.ordinaryOnly || isOrdinary(c)) && (!r.suit || c.suit === r.suit) && base < r.min) base = r.min;
    else if (r.kind === "multNext" && isOrdinary(c) && (!r.suit || c.suit === r.suit)) base = Math.floor(base * r.mult);
  }
  return Math.max(0, base + (c.beatDelta || 0) + (p.brace || 0) + (p.boost || 0));
}

export function label(c) {
  if (!c) return "nothing";
  if (isBlessed(c)) return "Blessed";
  if (isStatus(c)) return SUIT_INFO[c.suit].status;
  return `${c.v === 1 ? "A" : c.v}${SUIT_INFO[c.suit].symbol}`;
}

// Everything one player brings: two standard decks.
export function playerCards(owner) {
  const cards = [];
  for (const copy of [1, 2]) {
    for (const suit of SUITS) for (let v = 1; v <= 10; v++) cards.push({ id: `${owner}/${suit}${v}.${copy}`, owner, suit, v });
  }
  for (const suit of SUITS) for (let n = 1; n <= STATUSES_PER_SUIT; n++) cards.push({ id: `${owner}/${suit}x.${n}`, owner, suit, v: 0, status: true });
  for (let n = 1; n <= BLESSED_PER_PLAYER; n++) cards.push({ id: `${owner}/B.${n}`, owner, v: 0, blessed: true });
  return cards;
}

// Split a player's cards into the starter deck and the reserve.
// others: the two remaining suits, in order: the first takes 2, 3, 6, 9 and the second 4, 5, 7, 8.
export function buildStarter(owner, primary, secondary, others) {
  const all = playerCards(owner);
  const want = [];
  for (const v of STARTER.primary) want.push([primary, v]);
  for (const v of STARTER.secondary) want.push([secondary, v]);
  STARTER.others.forEach((vals, i) => { for (const v of vals) want.push([others[i], v]); });
  const deck = [];
  for (const [suit, v] of want) {
    const i = all.findIndex((c) => isOrdinary(c) && c.suit === suit && c.v === v);
    deck.push(all.splice(i, 1)[0]);
  }
  return { deck, reserve: all };
}

// The GM's world deck: one standard deck's A–10, shuffled fresh for each check.
export function worldCards() {
  const cards = [];
  for (const suit of SUITS) for (let v = 1; v <= 10; v++) cards.push({ id: `world/${suit}${v}`, owner: "world", suit, v });
  return cards;
}
