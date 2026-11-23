// Simple bot players, matching the bots in scripts/simulate_tally.mjs, so engine-driven games can be compared
// with the published simulations. A bot reads only its own hand and the public table.
import { apply } from "./index.mjs";
import { legalCards, stumblePrice, canPlay } from "./check.mjs";
import { isStatus, isBlessed, isOrdinary, countsNow } from "./cards.mjs";

const total = (p) => p.tally.reduce((a, t) => a + t.score, 0);
const onSuit = (c, p, w) => !isBlessed(c) && (c.suit === p.approach || c.suit === w.suit);

// Which losing card to spend: statuses first, Dexterity and Weird next, then Strength, Intelligence, and Stumble last
// (a played Stumble goes on top of the deck for next check; in older games it costs Stumble's Price).
function passOrder(c) {
  if (isBlessed(c)) return 9;
  if (isStatus(c)) return c.suit === "D" ? 6 : 1;
  return { D: 2, W: 2, S: 3, I: 4 }[c.suit];
}

// What a world card counts for beating (a GM adjustment or the world's Brace or Mirror), and what taking it would
// score after the player's and the world's Shave.
const beatOf = (wc) => wc.beat ?? wc.v;
const prizeOf = (wc, p) => Math.max(0, wc.v - (p.shave || 0) - (wc.shave || 0));

// How much a player wants this world card next: 3 exact, 2 fits, 0 no use, -2 forces a busting win.
export function worth(p, wc) {
  const need = p.target - total(p);
  const prize = prizeOf(wc, p);
  const beats = p.hand.filter((c) => !isBlessed(c) && onSuit(c, p, wc) && countsNow(c, p) > beatOf(wc));
  if (p.hand.length && beats.length === p.hand.length && prize > need) return -2;
  if (!beats.length || need <= 0 || prize > need) return 0;
  return prize === need ? 3 : 2;
}

export function chooseLock(state, charId) {
  const ck = state.check;
  const p = ck.players[charId];
  const w = ck.worldRow[ck.trick];
  const legal = new Set(legalCards(state, charId));
  const hand = p.hand.filter((c) => legal.has(c.id));
  let card;
  if (hand.every(isStatus) && hand.length && hand.length < p.hand.length) {
    card = hand[0]; // a forced status
  } else {
    const need = p.target - total(p);
    const prize = prizeOf(w, p);
    const blessed = hand.find(isBlessed);
    if (blessed && prize === need) card = blessed;
    else {
      const opts = hand.filter((c) => !isBlessed(c)).map((c) => ({ c, bv: countsNow(c, p), beats: onSuit(c, p, w) && countsNow(c, p) > beatOf(w) }));
      const beaters = opts.filter((o) => o.beats).sort((a, b) => a.bv - b.bv);
      if (beaters.length && prize <= need) card = beaters[beaters.length > 1 && beaters[0].bv - beatOf(w) < 2 ? 1 : 0].c;
      else {
        const losers = opts.filter((o) => !o.beats).sort((a, b) => passOrder(a.c) - passOrder(b.c) || a.c.v - b.c.v);
        card = losers.length ? losers[0].c : beaters.length ? beaters[0].c : hand[0];
      }
    }
  }
  let priceCardId;
  if (isStatus(card) && card.suit === "D" && stumblePrice(state)) {
    const ords = p.hand.filter((c) => c !== card && isOrdinary(c)).sort((a, b) => a.v - b.v);
    if (ords.length) priceCardId = ords[0].id;
  }
  return { type: "lockCard", charId, cardId: card.id, priceCardId };
}

export function answerPrompt(state, prompt) {
  const ck = state.check;
  const p = ck.players[prompt.charId];
  if (prompt.type === "recalculate") {
    const status = p.hand.find(isStatus);
    const drop = status || [...p.hand].filter((c) => !isBlessed(c)).sort((a, b) => a.v - b.v)[0] || p.hand[0];
    return { type: "recalculate", charId: prompt.charId, cardId: drop.id };
  }
  if (prompt.type === "peek") {
    // Replace the next world card when taking it would overshoot the target.
    const w = ck.worldRow[ck.trick];
    const total = p.tally.reduce((a, t) => a + t.score, 0);
    return { type: "peek", charId: prompt.charId, replace: !!w && p.target != null && total + w.v > p.target };
  }
  if (prompt.type === "evolve") return { type: "evolve", charId: prompt.charId, skip: true };
  if (prompt.type === "evolvePick") return { type: "evolvePick", charId: prompt.charId, cardId: prompt.options[0] };
  if (prompt.type === "peekDeck") return { type: "resolvePeekDeck", charId: prompt.charId, keepOrder: prompt.cards, discard: [] };
  if (prompt.type === "peekWorld") return { type: "resolvePeekWorld", charId: prompt.charId };
  throw new Error(`No bot answer for ${prompt.type}`);
}

// ---- Bots at the table ----

// Left to right: the leftmost card it may legally play; for older games' Stumble's Price, its leftmost ordinary card.
export function chooseLockLeftToRight(state, charId) {
  const p = state.check.players[charId];
  const legal = new Set(legalCards(state, charId));
  const card = p.hand.find((c) => legal.has(c.id));
  let priceCardId;
  if (card && isStatus(card) && card.suit === "D" && stumblePrice(state)) priceCardId = p.hand.find((c) => c !== card && isOrdinary(c))?.id;
  return { type: "lockCard", charId, cardId: card.id, priceCardId };
}

// Left to right answers are fixed too: never Peek, Recalculate its leftmost card, never evolve.
function answerLeftToRight(state, prompt) {
  const p = state.check.players[prompt.charId];
  if (prompt.type === "peek") return { type: "peek", charId: prompt.charId, replace: false };
  if (prompt.type === "recalculate") return { type: "recalculate", charId: prompt.charId, cardId: p.hand[0].id };
  if (prompt.type === "evolve") return { type: "evolve", charId: prompt.charId, skip: true };
  if (prompt.type === "evolvePick") return { type: "evolvePick", charId: prompt.charId, cardId: prompt.options[0] };
  if (prompt.type === "peekDeck") return { type: "resolvePeekDeck", charId: prompt.charId, keepOrder: prompt.cards, discard: [] };
  if (prompt.type === "peekWorld") return { type: "resolvePeekWorld", charId: prompt.charId };
  throw new Error(`No left-to-right answer for ${prompt.type}`);
}

// The next thing a bot character should do in the running check, or null. The host applies it like a player's action.
export function nextBotAction(state) {
  const ck = state.check;
  if (!ck || ck.phase === "closed") return null;
  const bots = ck.participants.filter((id) => state.characters[id] && state.characters[id].bot);
  if (!bots.length) return null;
  if (ck.phase === "setup") {
    const id = bots.find((x) => !ck.players[x].approach);
    // A bot leans on its primary suit and leaves the goal to the table; the GM sets its target.
    return id ? { type: "declareApproach", charId: id, suit: state.characters[id].primary } : null;
  }
  const prompt = ck.pending.find((x) => bots.includes(x.charId));
  if (prompt) return state.characters[prompt.charId].bot === "ltr" ? answerLeftToRight(state, prompt) : answerPrompt(state, prompt);
  if (ck.phase === "play" && !ck.pending.length) {
    const id = bots.find((x) => !ck.locks[x] && canPlay(state, x));
    if (id) return state.characters[id].bot === "ltr" ? chooseLockLeftToRight(state, id) : chooseLock(state, id);
  }
  return null;
}

function nextPrompt(ck) {
  return ck.pending[0] || null;
}

// Play one whole check with bots. goals: { charId: { target, approach } }. Returns the final state.
export function playCheck(state, { kind = "standard", goals, consequences = [], tricks }, opts = { inPlace: true }) {
  const step = (a) => { state = apply(state, a, opts).state; };
  const ids = Object.keys(goals);
  step({ type: "beginCheck", kind, participants: ids, tricks });
  for (const id of ids) {
    const p = state.check.players[id];
    step({ type: "declareApproach", charId: id, suit: goals[id].approach, goal: p.survival ? undefined : "Bot goal" });
    if (!p.survival) step({ type: "setGoal", charId: id, target: goals[id].target });
  }
  step({ type: "deal" });
  for (let guard = 0; state.check.phase !== "resolve"; guard++) {
    if (guard > 10000) throw new Error("Check did not finish.");
    const ck = state.check;
    const prompt = nextPrompt(ck);
    if (prompt) { step(answerPrompt(state, prompt)); continue; }
    const id = ck.participants.find((x) => !ck.locks[x] && canPlay(state, x));
    step(chooseLock(state, id));
  }
  for (const c of consequences) step({ type: "addConsequence", ...c });
  const results = structuredClone(state.check.results);
  step({ type: "endCheck" });
  return { state, results };
}
