// Simple bot players, matching the bots in scripts/simulate_tally.mjs, so engine-driven games can be compared
// with the published simulations. A bot reads only its own hand and the public table.
import { apply } from "./index.mjs";
import { legalCards } from "./check.mjs";
import { isStatus, isBlessed, isOrdinary } from "./cards.mjs";

const total = (p) => p.tally.reduce((a, t) => a + t.score, 0);
const onSuit = (c, p, w) => !isBlessed(c) && (c.suit === p.approach || c.suit === w.suit);

// Which losing card to spend: statuses first, Spades and Clubs next, then Hearts, Diamonds, and Stumble last.
function passOrder(c) {
  if (isBlessed(c)) return 9;
  if (isStatus(c)) return c.suit === "D" ? 6 : 1;
  return { D: 2, W: 2, S: 3, I: 4 }[c.suit];
}

// How much a player wants this world card next: 3 exact, 2 fits, 0 no use, -2 forces a busting win.
export function worth(p, wc) {
  const need = p.target - total(p);
  const prize = p.mirror ? 11 - wc.v : wc.v;
  const beats = p.hand.filter((c) => !isBlessed(c) && onSuit(c, p, wc) && c.v + p.brace > wc.v);
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
    const prize = p.mirror ? 11 - w.v : w.v;
    const blessed = hand.find(isBlessed);
    if (blessed && prize === need) card = blessed;
    else {
      const opts = hand.filter((c) => !isBlessed(c)).map((c) => ({ c, bv: c.v + p.brace, beats: onSuit(c, p, w) && c.v + p.brace > w.v }));
      const beaters = opts.filter((o) => o.beats).sort((a, b) => a.bv - b.bv);
      if (beaters.length && prize <= need) card = beaters[beaters.length > 1 && beaters[0].bv - w.v < 2 ? 1 : 0].c;
      else {
        const losers = opts.filter((o) => !o.beats).sort((a, b) => passOrder(a.c) - passOrder(b.c) || a.c.v - b.c.v);
        card = losers.length ? losers[0].c : beaters.length ? beaters[0].c : hand[0];
      }
    }
  }
  let priceCardId;
  if (isStatus(card) && card.suit === "D") {
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
  throw new Error(`No bot answer for ${prompt.type}`);
}

function nextPrompt(ck) {
  return ck.pending[0] || null;
}

// Play one whole check with bots. goals: { charId: { target, approach } }. Returns the final state.
export function playCheck(state, { kind = "standard", goals, consequences = [] }, opts = { inPlace: true }) {
  const step = (a) => { state = apply(state, a, opts).state; };
  const ids = Object.keys(goals);
  step({ type: "beginCheck", kind, participants: ids });
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
    const id = ck.participants.find((x) => !ck.locks[x] && ck.players[x].hand.length);
    step(chooseLock(state, id));
  }
  for (const c of consequences) step({ type: "addConsequence", ...c });
  const results = structuredClone(state.check.results);
  step({ type: "endCheck" });
  return { state, results };
}
