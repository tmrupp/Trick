// A Tally check, from setup to cleanup (RULES.md: Start a check, Play the tricks, Consolations,
// Statuses, Blessed, Resolve the check, Survival).
import { SUITS, SUIT_INFO, worldCards, isOrdinary, isStatus, isBlessed, label, countsAs, countsNow } from "./cards.mjs";
import { CHECK_KINDS } from "./rules.mjs";
import { rule, character, drawOwed, gainStatus, returnToReserve, injuriesInTop, scanAfterInjury, survivalTarget, moveCard, placeCard, findItem } from "./campaign.mjs";

export { CHECK_KINDS } from "./rules.mjs";

export const RESULT_RANK = { critical: 4, success: 3, partial: 2, failure: 1, bust: 0 };

export const tallyTotal = (p) => p.tally.reduce((a, t) => a + t.score, 0);
export const isBusted = (p) => p.target != null && tallyTotal(p) > p.target;
export const bustSitOut = (st) => !!(st.rules && st.rules.bustSitOut);
export const canPlay = (st, id) => {
  const p = st.check && st.check.players[id];
  return !!(p && p.hand.length && !p.sitOut && !(bustSitOut(st) && isBusted(p)));
};

export function resultFor(tally, target) {
  if (tally > target) return "bust";
  const short = target - tally;
  if (short === 0) return "critical";
  if (short <= 3) return "success";
  if (short <= 6) return "partial";
  return "failure";
}

const take = (pile, pred) => { const i = pile.findIndex(pred); return i < 0 ? null : pile.splice(i, 1)[0]; };

function activeCheck(st, phases) {
  const ck = st.check;
  if (!ck || ck.phase === "closed") throw rule("No check is running.");
  if (phases && !phases.includes(ck.phase)) throw rule(`That can't be done now (the check is in ${ck.phase}).`);
  return ck;
}

function participant(ck, charId) {
  const p = ck.players[charId];
  if (!p) throw rule("That character isn't in this check.");
  return p;
}

// Participants in seat order (display order only; no rule depends on it).
function seatOrder(st, ids) {
  const n = st.seats.length;
  const from = ((st.gmSeat % n) + n) % n;
  const ring = st.seats.slice(from).concat(st.seats.slice(0, from));
  return ring.filter((id) => ids.includes(id));
}

// ---- Setup ----

// The GM's description of the overall situation the check is about. Optional: it may be spoken at the table.
const SITUATION_MAX = 300;
const situationText = (s) => String(s ?? "").trim().slice(0, SITUATION_MAX) || null;

// kind sets the target range and the default size; tricks, if given, is the GM's exact number of tricks.
// situation, if given, is the GM's description of what the check is about.
export function beginCheck(ctx, { kind = "standard", participants, tricks: wanted, situation }) {
  const st = ctx.state;
  if (st.check && st.check.phase !== "closed") throw rule("A check is already running.");
  // A deck peek offered between checks lives outside the check: answer it first, or it couldn't be answered until after.
  if ((st.betweenPending || []).length) throw rule("Finish the waiting choices first: a deck peek is still open.");
  const spec = CHECK_KINDS[kind];
  if (!spec) throw rule("A check is standard, quick or solo.");
  const ids = [...new Set(participants || [])];
  if (!ids.length) throw rule("Choose who takes part.");
  for (const id of ids) {
    if (!character(st, id).alive) throw rule(`${character(st, id).name} is dead.`);
    if (character(st, id).retired) throw rule(`${character(st, id).name} is retired.`);
  }
  if (kind === "solo" && ids.length !== 1) throw rule("A solo check has one player.");
  if (wanted !== undefined && (!Number.isInteger(wanted) || wanted < 1 || wanted > 40)) throw rule("A check has 1 to 40 tricks.");
  const tricks = wanted ?? spec.tricks(ids.length);
  // Snapshot each participant BEFORE the check-start survival scan mutates ch.survival, so cancelling undoes it cleanly.
  const before = Object.fromEntries(ids.map((id) => [id, structuredClone(st.characters[id])]));
  const players = {};
  for (const id of ids) {
    const ch = st.characters[id];
    // Survival scan at check start, before drawing; a recorded requirement is used as it is.
    if (!ch.survival) {
      const M = injuriesInTop(ch, tricks);
      if (M >= 2) {
        ch.survival = { M, N: tricks };
        ctx.events.push({ type: "survivalRequired", id, M, target: survivalTarget(st, M), immediate: false });
      }
    }
    players[id] = {
      goal: ch.survival ? "Survive" : null,
      target: ch.survival ? survivalTarget(st, ch.survival.M) : null,
      survival: ch.survival ? { ...ch.survival } : null,
      approach: null, approved: false,
      hand: [], played: [], tally: [], aside: [], cardRules: [], sitOut: false,
      brace: 0, mirror: false, shave: 0,
      drawOwed: 0, evolveAsked: false, afterShuffle: null,
    };
  }
  st.check = {
    id: (st.checkCount = (st.checkCount || 0) + 1),
    kind, tricks, participants: seatOrder(st, ids), players,
    situation: situationText(situation),
    phase: "setup", worldRow: [], worldDeck: [], worldTaken: [], trick: 0,
    // Each participant as they were before the check, so the GM can cancel it as if it never began.
    before,
    locks: {}, pending: [], log: [], consequences: [], results: null,
  };
  ctx.events.push({ type: "checkBegun", kind, tricks, participants: st.check.participants, situation: st.check.situation });
}

// The GM describes, rewrites or clears the overall situation at any point while the check runs.
export function setSituation(ctx, { situation }) {
  const ck = activeCheck(ctx.state);
  ck.situation = situationText(situation);
  ctx.events.push({ type: "situationSet", situation: ck.situation });
}

// The GM sets up a participant directly: any of their trump (suit), goal and target. The GM has the final say;
// a player's own declaration (declareApproach) is a convenience that fills these in. Once a participant has
// both a trump and a target, the GM's word accepts them.
export function setGoal(ctx, { charId, goal, target, suit }) {
  const ck = activeCheck(ctx.state, ["setup"]);
  const p = participant(ck, charId);
  if (target !== undefined) {
    if (!Number.isInteger(target) || target < 1) throw rule("A target is a whole number of at least 1.");
    if (p.survival) {
      const want = survivalTarget(ctx.state, p.survival.M);
      if (target !== want) throw rule(`Survival is a forced goal at target ${want}.`);
    }
  }
  if (suit !== undefined && !SUITS.includes(suit)) throw rule("A trump is S, D, I or W.");
  if (target === undefined && suit === undefined && goal === undefined) throw rule("Set a trump, a goal or a target.");
  if (suit !== undefined) p.approach = suit;
  if (goal !== undefined && !p.survival) p.goal = String(goal ?? "").trim().slice(0, 100) || null;
  if (target !== undefined) p.target = target;
  p.approved = !!(p.approach && p.target != null);
  const [lo, hi] = CHECK_KINDS[ck.kind].targets;
  ctx.events.push({ type: "goalSet", id: charId, target: p.target, suit: p.approach, outsideRange: p.target != null && (p.target < lo || p.target > hi) });
}

// The player states their goal and the suit it uses, which is their trump. The goal is the approach: there's
// no separate approach text. A forced goal (survival) can't be restated, and its fixed target accepts it at once.
// Restating a goal sends it back to the GM, who confirms or changes the target.
// The player may suggest a difficulty as a target; the GM decides.
export function declareApproach(ctx, { charId, suit, approach, goal, suggested }) {
  const ck = activeCheck(ctx.state, ["setup"]);
  const p = participant(ck, charId);
  if (!SUITS.includes(suit)) throw rule("A goal's suit is S, D, I or W.");
  if (suggested != null && (!Number.isInteger(suggested) || suggested < 1 || suggested > 40)) throw rule("A suggested target is a whole number from 1 to 40.");
  // The goal's words are optional: it may be spoken at the table or obvious from the situation.
  if (goal !== undefined && !p.survival) p.goal = String(goal ?? "").trim().slice(0, 100) || null;
  p.approach = suit;
  p.suggested = p.survival ? null : suggested ?? null;
  p.approachText = (approach && String(approach).slice(0, 60)) || null; // older saves only
  p.approved = !!p.survival;
  ctx.events.push({ type: "approachDeclared", id: charId, suit });
}


// Deal the world row and draw hands.
// The GM can deal at any time: nobody has to submit anything first. Anyone not set up gets their primary suit as
// trump and their suggested target, or the check's default; whatever the participant last declared stands.
export function defaultsFor(st, ck, id) {
  const p = ck.players[id];
  return { suit: p.approach || st.characters[id].primary, target: p.target ?? p.suggested ?? CHECK_KINDS[ck.kind].defaultTarget };
}

export function deal(ctx) {
  const st = ctx.state;
  const ck = activeCheck(st, ["setup"]);
  for (const id of ck.participants) {
    const p = ck.players[id];
    const d = defaultsFor(st, ck, id);
    if (!p.approach || p.target == null) ctx.events.push({ type: "setupDefaulted", id, suit: d.suit, target: d.target });
    p.approach = d.suit;
    p.target = d.target;
    p.approved = true;
  }
  const world = ctx.rng.shuffle(worldCards());
  ck.worldRow = world.splice(0, ck.tricks);
  ck.worldDeck = world; // its top is the last element
  ck.phase = "deal";
  ctx.events.push({ type: "dealt", row: ck.worldRow.map(label) });
  for (const id of ck.participants) {
    const p = ck.players[id];
    p.drawOwed = ck.tricks;
    drawOwed(ctx, st.characters[id], p);
  }
  advance(ctx);
}

// ---- Play ----

function mustPlayStatus(p, w) {
  return p.hand.some((c) => isStatus(c) && c.suit === w.suit);
}

export function legalCards(st, charId) {
  const ck = st.check;
  const p = ck.players[charId];
  const w = ck.worldRow[ck.trick];
  if (!w || !canPlay(st, charId)) return [];
  if (mustPlayStatus(p, w)) return p.hand.filter((c) => isStatus(c) && c.suit === w.suit).map((c) => c.id);
  return p.hand.map((c) => c.id);
}

export function lockCard(ctx, { charId, cardId, priceCardId }) {
  const st = ctx.state;
  const ck = activeCheck(st, ["play"]);
  if (ck.pending.length) throw rule("Finish waiting choices before locking a card.");
  const p = participant(ck, charId);
  if (p.sitOut) throw rule("You are sitting out the rest of this check.");
  if (bustSitOut(st) && isBusted(p)) throw rule("You have busted and sit out the rest of this check.");
  if (ck.locks[charId] && ck.locks[charId].random) throw rule(RANDOM_LOCKED);
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) throw rule("That card isn't in your hand.");
  if (!legalCards(st, charId).includes(cardId)) {
    throw rule(`You must play your ${SUIT_INFO[ck.worldRow[ck.trick].suit].status}: the world card is ${SUIT_INFO[ck.worldRow[ck.trick].suit].name}.`);
  }
  // Older games' Stumble's Price: discard an ordinary card from hand, your choice.
  let price = null;
  if (isStatus(card) && card.suit === "D" && stumblePrice(st)) {
    const ordinaries = p.hand.filter((c) => isOrdinary(c));
    if (ordinaries.length) {
      price = ordinaries.find((c) => c.id === priceCardId);
      if (!price) throw rule("Stumble's Price: choose an ordinary card from your hand to discard.");
    }
  }
  ck.locks[charId] = { cardId, priceCardId: price ? price.id : null };
  ctx.events.push({ type: "locked", id: charId });
  if (ck.participants.every((id) => ck.locks[id] || !canPlay(st, id))) resolveTrick(ctx);
}

// A card locked at random (gmLockRandom, e.g. Hushbell Chain) stays: only the GM can undo it, with force
// (server/room.mjs refuses force from a player's seat).
const RANDOM_LOCKED = "That card was locked at random: it plays this trick.";

export function unlockCard(ctx, { charId, force = false }) {
  const ck = activeCheck(ctx.state, ["play"]);
  if (!ck.locks[charId]) throw rule("You haven't locked a card.");
  if (ck.locks[charId].random && !force) throw rule(RANDOM_LOCKED);
  delete ck.locks[charId];
  ctx.events.push({ type: "unlocked", id: charId });
}

// Who takes the trick (RULES.md, Play the tricks 3–5, and Blessed).
// Also supports GM trick modifiers: w.invert (lowest card of world's suit under world wins, no trump)
// and w.worldCannotWin (world cannot take the trick; highest on-suit card takes it).
export function trickWinner(w, plays) {
  if (!plays.length) return { winner: null, reason: w.worldCannotWin ? "noOnSuit" : "worldHighest" };
  const blessed = plays.filter((x) => isBlessed(x.card));
  if (blessed.length === 1) return { winner: blessed[0], reason: "blessed" };
  if (blessed.length > 1) return { winner: null, reason: "blessedTie" };
  const wv = w.beat ?? w.v; // a GM adjustment can change what a world card counts for beating
  if (w.invert) {
    const under = plays.filter((x) => x.card.suit === w.suit && x.bv < wv);
    if (!under.length) return { winner: null, reason: w.worldCannotWin ? "noOnSuit" : "worldInverted" };
    const low = Math.min(...under.map((x) => x.bv));
    const atLow = under.filter((x) => x.bv === low);
    return atLow.length === 1 ? { winner: atLow[0], reason: "inverted" } : { winner: null, reason: "tieLevel" };
  }
  const score = (x) => (x.card.suit === w.suit ? 2 : 0) + (x.card.suit === x.approach ? 1 : 0);
  if (w.worldCannotWin) {
    const on = plays.filter((x) => x.onSuit);
    if (!on.length) return { winner: null, reason: "noOnSuit" };
    const top = Math.max(...on.map((x) => x.bv));
    const atTop = on.filter((x) => x.bv === top);
    if (atTop.length === 1) return { winner: atTop[0], reason: "worldCannotWin" };
    const best = Math.max(...atTop.map(score));
    const tops = atTop.filter((x) => score(x) === best);
    return tops.length === 1 ? { winner: tops[0], reason: "tieBreak" } : { winner: null, reason: "tieLevel" };
  }
  const top = Math.max(wv, ...plays.map((x) => x.bv));
  if (top <= wv) return { winner: null, reason: "worldHighest" };
  const atTop = plays.filter((x) => x.bv === top);
  if (atTop.length === 1) return atTop[0].onSuit ? { winner: atTop[0], reason: "highest" } : { winner: null, reason: "blocked", by: atTop[0] };
  if (!atTop.every((x) => x.onSuit)) return { winner: null, reason: "blocked", by: atTop.find((x) => !x.onSuit) };
  // Suit, then trump: world suit and own trump > world suit only > own trump only.
  const best = Math.max(...atTop.map(score));
  const tops = atTop.filter((x) => score(x) === best);
  return tops.length === 1 ? { winner: tops[0], reason: "tieBreak" } : { winner: null, reason: "tieLevel" };
}

function resolveTrick(ctx) {
  const st = ctx.state;
  const ck = st.check;
  const w = ck.worldRow[ck.trick];
  const last = ck.trick === ck.tricks - 1;
  const plays = [];
  for (const id of ck.participants) {
    const lock = ck.locks[id];
    if (!lock) continue; // empty hand: sit out
    const ch = st.characters[id];
    const p = ck.players[id];
    const card = take(p.hand, (c) => c.id === lock.cardId);
    if (lock.priceCardId) {
      const price = take(p.hand, (c) => c.id === lock.priceCardId);
      ch.discard.push(price);
      ctx.events.push({ type: "pricePaid", id, card: label(price) });
    }
    plays.push({
      id, card, approach: p.approach, mirrored: p.mirror && isOrdinary(card),
      bv: countsNow(card, p),
      boost: p.boost || 0, brace: p.brace, shave: p.shave || 0,
      onSuit: !isBlessed(card) && (card.suit === p.approach || card.suit === w.suit),
      pinned: !!card.pinned,
    });
    // Consume any one-shot multNext rule that applied to this played card.
    if (p.cardRules && p.cardRules.length && isOrdinary(card)) {
      const mi = p.cardRules.findIndex((r) => r.kind === "multNext" && (!r.suit || card.suit === r.suit));
      if (mi >= 0) p.cardRules.splice(mi, 1);
    }
    p.brace = 0;
    p.mirror = false;
    p.shave = 0;
    p.boost = 0;
  }
  const { winner, reason, by } = trickWinner(w, plays);
  let score = 0;
  if (winner) {
    // Shave, the winner's own and the world's: the win scores that much less, never below 0.
    const shave = (winner.shave || 0) + (w.shave || 0);
    score = Math.max(0, w.v - shave);
    ck.players[winner.id].tally.push({ card: w, mirrored: false, score, shave });
  } else if (!w.worldCannotWin) ck.worldTaken.push(w);
  for (const x of plays) {
    // A played Blessed returns to its owner's reserve, even if it was given to someone else.
    if (isBlessed(x.card)) returnToReserve(st.characters[x.card.owner] || st.characters[x.id], x.card);
    // A pinned card (e.g. Grave Sledge) returns straight to hand instead of played row and gives no consolation.
    else if (x.pinned) ck.players[x.id].hand.push(x.card);
    else { delete x.card.beat; delete x.card.beatDelta; ck.players[x.id].played.push(x.card); }
  }
  ck.log.push({
    trick: ck.trick, world: w.id, worldLabel: label(w), worldBeat: w.beat ?? w.v,
    plays: plays.map((x) => ({ id: x.id, card: x.card.id, label: label(x.card), bv: x.bv, brace: x.brace, boost: x.boost, onSuit: x.onSuit, mirrored: x.mirrored, shave: x.shave, pinned: x.pinned })),
    winner: winner ? winner.id : null, reason, by: by ? by.id : null, score, worldShave: w.shave || 0,
  });
  ctx.events.push({
    type: "trickResolved", trick: ck.trick, world: label(w),
    plays: plays.map((x) => ({ id: x.id, card: label(x.card) })),
    winner: winner ? winner.id : null, reason, by: by ? by.id : null, score,
  });
  // Consolations, all at once, for everyone who did not win; none after the final trick. Each happens by itself:
  // Brace and Shave wait on your next card, Mirror turns it, and Recalculate draws a card now.
  if (!last) {
    const auto = consolationsV2(st);
    if (!auto) legacyPeek(ctx, plays, winner); // games begun before consolations became automatic
    for (const x of plays) {
      if (x === winner || isBlessed(x.card) || x.pinned) continue;
      const p = ck.players[x.id];
      const s = x.card.suit;
      if (s === "S") p.brace = x.card.v;
      else if (s === "W") p.mirror = true;
      else if (s === "D") { if (auto) p.shave = SHAVE; }
      else if (s === "I") {
        if (auto) { p.drawOwed = (p.drawOwed || 0) + 1; ctx.events.push({ type: "recalculated", id: x.id, drew: true }); drawOwed(ctx, st.characters[x.id], p); }
        else if (p.hand.length) ck.pending.push({ type: "recalculate", charId: x.id });
      }
    }
  }
  // The world's consolation: when a player takes the world card, its suit changes the next one. None after the final trick.
  if (!last && winner && worldConsoles(st)) worldConsolation(ctx, w);
  ck.locks = {};
  ck.trick++;
  ck.phase = last ? "resolve" : "consolation";
  if (last) computeResults(ctx);
  advance(ctx);
}

// Shave (Dexterity's consolation): your next win scores this much less.
export const SHAVE = 1;
// Games begun since consolations became automatic (Shave and Recalculate's draw) carry rules.consolations 2.
// Older games keep Peek and the choosing Recalculate: see legacy.mjs.
export const consolationsV2 = (st) => !!(st.rules && st.rules.consolations === 2);
// Games begun since Stumble changed carry rules.stumble "deck": a played Stumble goes on top of your deck at cleanup.
// Older games keep Stumble's Price (discard an ordinary card, your choice): see legacy.mjs.
export const stumblePrice = (st) => !(st.rules && st.rules.stumble === "deck");
// Games begun since the world took consolations carry rules.world "lose". Older games have none: see legacy.mjs.
export const worldConsoles = (st) => !!(st.rules && st.rules.world === "lose");

// The world's consolation (RULES.md, The world's consolation), from the suit of the world card a player just took:
// Strength Braces the next world card by this card's value, Dexterity Shaves it, Intelligence Peeks (the next world
// card goes to the bottom of the world deck and its top card takes its place), Weird Mirrors it. Brace and Mirror
// work from what the next card already counts for beating, a GM adjustment included.
function worldConsolation(ctx, w) {
  const ck = ctx.state.check;
  const i = ck.trick + 1;
  const next = ck.worldRow[i];
  if (!next) return;
  const counts = next.beat ?? next.v;
  let effect;
  if (w.suit === "S") { ck.worldRow[i] = { ...next, beat: counts + w.v }; effect = "brace"; }
  else if (w.suit === "W") { ck.worldRow[i] = { ...next, beat: Math.max(0, 11 - counts) }; effect = "mirror"; }
  else if (w.suit === "D") { ck.worldRow[i] = { ...next, shave: (next.shave || 0) + SHAVE }; effect = "shave"; }
  else if (w.suit === "I") { if (!ck.worldDeck.length) return; replaceNext(ctx, [], i, { quiet: true }); effect = "peek"; }
  else return;
  const record = { effect, was: label(next), next: label(ck.worldRow[i]), beat: ck.worldRow[i].beat ?? null };
  ck.log[ck.log.length - 1].worldConsolation = record; // kept apart from .world (the world card id)
  ctx.events.push({ type: "worldConsoled", from: label(w), by: w.v, ...record });
}

// Older games' Peek: each player who lost with a Dexterity card chooses, in secret, whether to replace the next world
// card with the world deck's unseen top card. It is replaced once if any of them chooses to. Saves made while Peek was
// automatic replay with rules.peek "auto".
function legacyPeek(ctx, plays, winner) {
  const st = ctx.state, ck = st.check;
  const peekers = plays.filter((x) => x !== winner && !isBlessed(x.card) && x.card.suit === "D").map((x) => x.id);
  if (!peekers.length || !ck.worldDeck.length) return;
  if ((st.rules && st.rules.peek) === "auto") replaceNext(ctx, peekers, ck.trick + 1);
  else {
    ck.peekVotes = [];
    for (const id of peekers) ck.pending.push({ type: "peek", charId: id });
  }
}

// Put world row card i on the bottom of the world deck and deal the top card face up in its place.
// The world's Peek uses it too, with its own event.
function replaceNext(ctx, by, i, { quiet = false } = {}) {
  const ck = ctx.state.check;
  const old = ck.worldRow[i];
  ck.worldRow[i] = ck.worldDeck.pop();
  ck.worldDeck.unshift(old);
  if (!quiet) ctx.events.push({ type: "peekReplaced", by, out: label(old), in: label(ck.worldRow[i]) });
}

// Answer a Peek: replace the next world card, unseen, or keep it. Nobody sees anyone else's answer;
// once every Peek is in, the card is replaced once if anyone chose to. (`swap` is the older saves' name.)
export function peek(ctx, { charId, replace, swap }) {
  const ck = activeCheck(ctx.state, ["consolation"]);
  const pi = ck.pending.findIndex((x) => x.type === "peek" && x.charId === charId);
  if (pi < 0) throw rule("You have no Peek to answer.");
  ck.pending.splice(pi, 1);
  if (replace ?? swap) ck.peekVotes.push(charId);
  ctx.events.push({ type: "peekAnswered", id: charId });
  if (!ck.pending.some((x) => x.type === "peek")) {
    const voters = ck.peekVotes;
    delete ck.peekVotes;
    if (voters.length && ck.worldDeck.length) replaceNext(ctx, voters, ck.trick); // ck.trick has already moved on to the next trick
    else ctx.events.push({ type: "peekKept", world: label(ck.worldRow[ck.trick]) });
  }
  advance(ctx);
}

export function recalculate(ctx, { charId, cardId }) {
  const st = ctx.state;
  const ck = activeCheck(st, ["consolation"]);
  const pi = ck.pending.findIndex((x) => x.type === "recalculate" && x.charId === charId);
  if (pi < 0) throw rule("You have no Recalculate to resolve.");
  const p = ck.players[charId];
  const ch = st.characters[charId];
  const card = take(p.hand, (c) => c.id === cardId);
  if (!card) throw rule("Discard a card from your hand.");
  ch.discard.push(card);
  ck.pending.splice(pi, 1);
  ctx.events.push({ type: "recalculated", id: charId });
  p.drawOwed = 1;
  drawOwed(ctx, ch, p);
  advance(ctx);
}

// Between tricks, give your Blessed to another player, then draw one card yourself.
export function giveBlessed(ctx, { charId, to, cardId }) {
  const st = ctx.state;
  const ck = activeCheck(st, ["play", "consolation"]);
  if (ck.phase === "play" && Object.keys(ck.locks).length) throw rule("Give a Blessed between tricks, before anyone locks a card.");
  const p = participant(ck, charId);
  const q = participant(ck, to);
  if (bustSitOut(st) && (isBusted(p) || isBusted(q))) throw rule("A busted player sits out the rest of the check.");
  if (to === charId) throw rule("Give it to another player.");
  const card = take(p.hand, (c) => c.id === cardId && isBlessed(c));
  if (!card) throw rule("You hold no such Blessed.");
  q.hand.push(card);
  ctx.events.push({ type: "blessedGiven", from: charId, to });
  p.drawOwed = 1;
  drawOwed(ctx, st.characters[charId], p);
  advance(ctx);
}

// Move on once nothing is waiting: from the deal to play, from consolations to the next trick.
export function settle(ctx) {
  if (ctx.state.check && ctx.state.check.phase !== "closed") advance(ctx);
}

function advance(ctx) {
  const st = ctx.state;
  const ck = st.check;
  if (ck.pending.length) return;
  if (ck.phase === "deal" || ck.phase === "consolation") {
    ck.phase = "play";
    ctx.events.push({ type: "trickReady", trick: ck.trick, world: label(ck.worldRow[ck.trick]) });
    // Anyone with an empty hand or who has busted sits out; if nobody can play, the world takes the trick.
    if (ck.participants.every((id) => !canPlay(st, id))) resolveTrick(ctx);
  } else if (ck.phase === "play" && ck.participants.every((id) => ck.locks[id] || !canPlay(st, id))) {
    resolveTrick(ctx);
  }
}

// ---- Resolution and cleanup ----

export function computeResults(ctx) {
  const ck = ctx.state.check;
  ck.results = {};
  for (const id of ck.participants) {
    const p = ck.players[id];
    const tally = p.tally.reduce((a, t) => a + t.score, 0);
    const result = resultFor(tally, p.target);
    const dies = !!p.survival && (result === "bust" || result === "failure");
    ck.results[id] = { tally, target: p.target, result, short: Math.max(0, p.target - tally), dies };
  }
  ctx.events.push({ type: "checkResolved", results: ck.results });
}

// Incompatible goals: the better result wins; on the same result, the tally closer to its target. Else a stalemate.
export function compareGoals(results, a, b) {
  const ra = results[a], rb = results[b];
  if (RESULT_RANK[ra.result] !== RESULT_RANK[rb.result]) return RESULT_RANK[ra.result] > RESULT_RANK[rb.result] ? a : b;
  const da = Math.abs(ra.target - ra.tally), db = Math.abs(rb.target - rb.tally);
  return da === db ? null : da < db ? a : b;
}

// The GM records consequence statuses during a check or before cleanup; they go on top of discard, Injuries last.
export function addConsequence(ctx, { charId, suit, compulsion }) {
  const ck = activeCheck(ctx.state, ["setup", "deal", "play", "consolation", "resolve"]);
  participant(ck, charId);
  if (!SUITS.includes(suit)) throw rule("Name the status by its suit: S, D, I or W.");
  const ch = ctx.state.characters[charId];
  const curseNamed = ch.compulsion.length || ck.consequences.some((c) => c.charId === charId && c.suit === "W" && c.compulsion);
  if (suit === "W" && !compulsion && !curseNamed) throw rule("A first Curse needs its compulsion.");
  ck.consequences.push({ charId, suit, compulsion: compulsion || null });
  ctx.events.push({ type: "consequenceAdded", id: charId, status: SUIT_INFO[suit].status });
}

export function removeConsequence(ctx, { index }) {
  const ck = activeCheck(ctx.state, ["setup", "deal", "play", "consolation", "resolve"]);
  if (!Number.isInteger(index) || index < 0 || index >= ck.consequences.length) throw rule("No such consequence to remove.");
  const [c] = ck.consequences.splice(index, 1);
  ctx.events.push({ type: "consequenceRemoved", id: c.charId, status: SUIT_INFO[c.suit].status });
}

export function endCheck(ctx) {
  const st = ctx.state;
  const ck = activeCheck(st, ["resolve"]);
  // Resolve goals and deaths, then clean up.
  for (const id of ck.participants) {
    const ch = st.characters[id];
    const r = ck.results[id];
    if (ck.players[id].survival) ch.survival = null;
    if (r.dies) { ch.alive = false; ctx.events.push({ type: "died", id }); }
  }
  for (const id of ck.participants) {
    const ch = st.characters[id];
    const p = ck.players[id];
    const unplayed = [...p.hand, ...(p.aside || []).map((a) => a.card)];
    for (const c of unplayed) { delete c.beat; delete c.beatDelta; delete c.pinned; }
    ctx.rng.shuffle(unplayed);
    ch.discard.push(...unplayed); // unplayed and set-aside cards, shuffled together
    p.hand = [];
    p.aside = [];
    p.cardRules = [];
    // The played row, earliest to latest. A played Stumble goes on top of the deck instead (older games: discard).
    const back = stumblePrice(st) ? [] : p.played.filter((c) => isStatus(c) && c.suit === "D");
    for (const c of p.played) {
      delete c.beat; delete c.beatDelta; delete c.pinned;
      if (back.includes(c)) placeCard(ctx, ch, c, "deck-top"); else ch.discard.push(c);
    }
    if (back.length) ctx.events.push({ type: "stumbleToDeck", id, n: back.length });
    p.played = [];
  }
  const injured = new Set();
  const ordered = [...ck.consequences.filter((c) => c.suit !== "S"), ...ck.consequences.filter((c) => c.suit === "S")];
  for (const c of ordered) {
    const ch = st.characters[c.charId];
    if (gainStatus(ctx, ch, c.suit, c.compulsion) && c.suit === "S") injured.add(c.charId);
  }
  ck.phase = "closed";
  st.lastCheckTricks = ck.tricks;
  for (const id of injured) scanAfterInjury(ctx, st.characters[id]);
  st.history.push({ id: ck.id, kind: ck.kind, tricks: ck.tricks, situation: ck.situation || null, results: ck.results, log: ck.log,
    // What each participant set out to do, and the statuses the GM gave at cleanup.
    players: Object.fromEntries(ck.participants.map((id) => { const p = ck.players[id]; return [id, { goal: p.goal || null, approach: p.approach || null, target: p.target, survival: !!p.survival }]; })),
    consequences: ck.consequences.map((c) => ({ ...c })) });
  ctx.events.push({ type: "checkClosed", id: ck.id });
}

// ---- GM adjustments: how item, race and fiction effects are applied during a check ----

// Your next played card counts this much higher (or lower) for beating.
export function gmBoost(ctx, { charId, amount, reason }) {
  const ck = activeCheck(ctx.state, ["setup", "deal", "play", "consolation"]);
  const p = participant(ck, charId);
  if (!Number.isInteger(amount)) throw rule("A boost is a whole number.");
  p.boost = (p.boost || 0) + amount;
  ctx.events.push({ type: "boosted", id: charId, amount, reason: reason || null });
}

// An unplayed world card counts this value for beating; whoever takes it still scores its printed value.
export function gmWorldValue(ctx, { index, value, reason }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  if (!Number.isInteger(index) || index < ck.trick || index >= ck.worldRow.length) throw rule("Choose an unplayed world card.");
  if (!Number.isInteger(value) || value < 0) throw rule("A value for beating is a whole number, 0 or more.");
  ck.worldRow[index] = { ...ck.worldRow[index], beat: value };
  ctx.events.push({ type: "worldValueSet", index, value, reason: reason || null });
}

export function gmAdjustTally(ctx, { charId, delta, reason }) {
  const st = ctx.state;
  const ck = activeCheck(st);
  const p = participant(ck, charId);
  if (!Number.isInteger(delta) || !delta) throw rule("Adjust the tally by a whole number.");
  p.tally.push({ card: null, adjustment: true, mirrored: false, score: delta, reason: reason || null });
  if (ck.phase === "play" && bustSitOut(st) && isBusted(p)) delete ck.locks[charId];
  if (ck.phase === "resolve") computeResults(ctx);
  ctx.events.push({ type: "tallyAdjusted", id: charId, delta, reason: reason || null });
  if (ck.phase === "play") advance(ctx);
}

export function gmAdjustTarget(ctx, { charId, target, reason }) {
  const st = ctx.state;
  const ck = activeCheck(st);
  const p = participant(ck, charId);
  if (!Number.isInteger(target) || target < 1) throw rule("A target is a whole number of at least 1.");
  p.target = target;
  if (ck.phase === "play" && bustSitOut(st) && isBusted(p)) delete ck.locks[charId];
  if (ck.phase === "resolve") computeResults(ctx);
  ctx.events.push({ type: "targetAdjusted", id: charId, target, reason: reason || null });
  if (ck.phase === "play") advance(ctx);
}

export function gmDraw(ctx, { charId, n = 1 }) {
  const ck = activeCheck(ctx.state, ["play", "consolation"]);
  const p = participant(ck, charId);
  if (!Number.isInteger(n) || n < 1 || n > 10) throw rule("Draw 1 to 10 cards.");
  p.drawOwed += n;
  drawOwed(ctx, ctx.state.characters[charId], p);
  ctx.events.push({ type: "gmDrew", id: charId, n });
}

// Discard a card from a participant's hand: the shared card move, limited to hands during play.
export function gmDiscard(ctx, { charId, cardId }) {
  const ck = activeCheck(ctx.state, ["play", "consolation"]);
  const p = participant(ck, charId);
  if (!p.hand.some((c) => c.id === cardId)) throw rule("That card isn't in their hand.");
  moveCard(ctx, { charId, cardId, to: "discard" });
}

// ---- Reusable Item & People Primitives ----

// Set a hand card aside during a check (e.g. Red Thread, Hearthhide Coat, Scoped Rifle).
export function gmSetAside(ctx, { charId, cardId, faceUp = true, tag }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  const p = participant(ck, charId);
  if (ck.locks[charId] && ck.locks[charId].cardId === cardId) throw rule("That card is locked in.");
  const card = take(p.hand, (c) => c.id === cardId);
  if (!card) throw rule("That card isn't in their hand.");
  p.aside = p.aside || [];
  p.aside.push({ card, faceUp: !!faceUp, setAtTrick: ck.trick, tag: tag ? String(tag).trim().slice(0, 40) || null : null });
  ctx.events.push({ type: "cardSetAside", id: charId, card: faceUp ? label(card) : null, faceUp: !!faceUp, tag: tag || null });
  if (ck.phase === "play") advance(ctx);
}

// Return a set-aside card to hand (with optional beating delta, e.g. Red Thread's +tricks away), discard, or tucked under an item.
export function gmReturnAside(ctx, { charId, cardId, to = "hand", beatDelta = 0, instanceId, itemId }) {
  const st = ctx.state;
  const ck = activeCheck(st, ["deal", "play", "consolation", "resolve"]);
  const p = participant(ck, charId);
  const ch = character(st, charId);
  const entry = take(p.aside || [], (a) => a.card.id === cardId);
  if (!entry) throw rule("That card isn't set aside.");
  const card = entry.card;
  if (to === "tucked") {
    const item = findItem(ch, instanceId || itemId);
    if (!item) { p.aside.push(entry); throw rule(`${ch.name} doesn't have that item.`); }
    delete card.beat; delete card.beatDelta; delete card.pinned;
    if (entry.faceUp) card.tuckFaceUp = true;
    item.tucked = item.tucked || [];
    item.tucked.push(card);
    ctx.events.push({ type: "cardTucked", id: charId, instanceId: item.id, itemId: item.itemId, card: label(card) });
    return;
  }
  if (to === "hand" && Number.isInteger(beatDelta) && beatDelta !== 0) card.beatDelta = (card.beatDelta || 0) + beatDelta;
  else { delete card.beat; delete card.beatDelta; delete card.pinned; }
  placeCard(ctx, ch, card, to);
  // A face-down card stays unnamed: everyone hears of this, and only its holder and the GM know which card it is.
  ctx.events.push({ type: "asideReturned", id: charId, card: entry.faceUp ? label(card) : null, to, beatDelta: to === "hand" ? beatDelta : 0 });
}

// Pin an ordinary card in hand face up: playing it returns it straight to hand without consolation (e.g. Grave Sledge).
export function gmPinCard(ctx, { charId, cardId, pinned = true }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  const p = participant(ck, charId);
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) throw rule("That card isn't in their hand.");
  if (pinned && !isOrdinary(card)) throw rule("Only an ordinary card can be pinned.");
  card.pinned = !!pinned;
  ctx.events.push({ type: "cardPinned", id: charId, card: label(card), pinned: !!pinned });
}

// Set or adjust a single hand card's beating value for this check (e.g. Black Wedge half, Scoped Rifle +5, Red Thread).
export function gmCardValue(ctx, { charId, cardId, beat, beatDelta, clear = false, reason }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  const p = participant(ck, charId);
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) throw rule("That card isn't in their hand.");
  if (isBlessed(card)) throw rule("Blessed has no beating value to change.");
  if (clear) { delete card.beat; delete card.beatDelta; }
  else {
    if (beat !== undefined) {
      if (!Number.isInteger(beat) || beat < 0 || beat > 30) throw rule("A card's value is 0 to 30.");
      card.beat = beat;
    }
    if (beatDelta !== undefined) {
      if (!Number.isInteger(beatDelta) || beatDelta < -20 || beatDelta > 20) throw rule("An adjustment is -20 to +20.");
      card.beatDelta = (card.beatDelta || 0) + beatDelta;
    }
  }
  // A hand card is hidden: name it only when it is pinned face up.
  ctx.events.push({ type: "cardValueSet", id: charId, card: card.pinned ? label(card) : null, beat: card.beat ?? null, beatDelta: card.beatDelta || 0, reason: reason || null });
}

// Add a check-scoped card value rule (Grip Bone setValue, Iron Apple minValue, Iron Apple Seed multNext).
export function gmCheckCardRule(ctx, { charId, kind, suit = null, matchValue, to, min, mult, ordinaryOnly = true, label: ruleLabel }) {
  const ck = activeCheck(ctx.state, ["setup", "deal", "play", "consolation"]);
  const p = participant(ck, charId);
  if (suit != null && !SUITS.includes(suit)) throw rule("A suit is S, D, I or W.");
  let entry;
  if (kind === "setValue") {
    if (!Number.isInteger(matchValue) || matchValue < 1 || matchValue > 10) throw rule("Choose a printed value from 1 to 10.");
    if (!Number.isInteger(to) || to < 0 || to > 30) throw rule("Choose a target value from 0 to 30.");
    entry = { kind, matchValue, to, label: String(ruleLabel || `${matchValue}s count as ${to}`).slice(0, 60) };
  } else if (kind === "minValue") {
    if (!Number.isInteger(min) || min < 1 || min > 20) throw rule("Choose a minimum value from 1 to 20.");
    entry = { kind, suit, min, ordinaryOnly: !!ordinaryOnly, label: String(ruleLabel || `${suit ? SUIT_INFO[suit].name + " " : ""}min ${min}`).slice(0, 60) };
  } else if (kind === "multNext") {
    if (typeof mult !== "number" || !Number.isFinite(mult) || mult <= 0 || mult > 5) throw rule("Choose a positive multiplier.");
    entry = { kind, suit, mult, label: String(ruleLabel || `Next ${suit ? SUIT_INFO[suit].name + " " : ""}×${mult}`).slice(0, 60) };
  } else throw rule("Unknown card rule kind.");
  p.cardRules = p.cardRules || [];
  p.cardRules.push(entry);
  ctx.events.push({ type: "cardRuleAdded", id: charId, rule: entry });
}

export function gmClearCardRules(ctx, { charId }) {
  const ck = activeCheck(ctx.state, ["setup", "deal", "play", "consolation"]);
  const p = participant(ck, charId);
  p.cardRules = [];
  ctx.events.push({ type: "cardRulesCleared", id: charId });
}

// Directly set or transfer a participant's active Brace, Shave, or Mirror (e.g. Porter's Rope).
export function gmSetConsolation(ctx, { charId, brace, shave, mirror, reason }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  const p = participant(ck, charId);
  if (brace !== undefined) {
    if (!Number.isInteger(brace) || brace < 0 || brace > 30) throw rule("Brace is 0 to 30.");
    p.brace = brace;
  }
  if (shave !== undefined) {
    if (!Number.isInteger(shave) || shave < 0 || shave > 10) throw rule("Shave is 0 to 10.");
    p.shave = shave;
  }
  if (mirror !== undefined) p.mirror = !!mirror;
  ctx.events.push({ type: "consolationSet", id: charId, brace: p.brace, shave: p.shave, mirror: p.mirror, reason: reason || null });
}

// Set trick-level modifiers on an unplayed world card: worldCannotWin (Black Wedge) or invert (Borrowed Face).
export function gmSetTrickMod(ctx, { index, worldCannotWin, invert, reason }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  if (!Number.isInteger(index) || index < ck.trick || index >= ck.worldRow.length) throw rule("Choose an unplayed world card.");
  const next = { ...ck.worldRow[index] };
  if (worldCannotWin !== undefined) next.worldCannotWin = !!worldCannotWin;
  if (invert !== undefined) next.invert = !!invert;
  ck.worldRow[index] = next;
  ctx.events.push({ type: "trickModSet", index, worldCannotWin: !!next.worldCannotWin, invert: !!next.invert, reason: reason || null });
}

// Mark a participant as sitting out the rest of the check (e.g. Hollow Blindfold) or bring them back.
export function gmSitOut(ctx, { charId, sitOut = true, reason }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  const p = participant(ck, charId);
  p.sitOut = !!sitOut;
  if (p.sitOut) delete ck.locks[charId];
  ctx.events.push({ type: "sitOutSet", id: charId, sitOut: p.sitOut, reason: reason || null });
  if (ck.phase === "play") advance(ctx);
}

// Lock a random legal card for each participant named who can play (e.g. Hushbell Chain), replacing any card they
// had already locked. The lock is binding: they can't unlock it or lock another.
export function gmLockRandom(ctx, { charIds, reason }) {
  const st = ctx.state;
  const ck = activeCheck(st, ["play"]);
  if (ck.pending.length) throw rule("Finish waiting choices before locking cards.");
  const targets = [...new Set(charIds || [])].filter((id) => ck.players[id] && canPlay(st, id));
  if (!targets.length) throw rule("Nobody selected can lock a card right now.");
  const locked = [];
  for (const id of targets) {
    const legal = legalCards(st, id);
    if (!legal.length) continue;
    const cardId = legal[ctx.rng.int(legal.length)];
    const p = ck.players[id];
    const card = p.hand.find((c) => c.id === cardId);
    let priceCardId = null;
    if (isStatus(card) && card.suit === "D" && stumblePrice(st)) {
      const ords = p.hand.filter((c) => isOrdinary(c));
      if (ords.length) priceCardId = ords[ctx.rng.int(ords.length)].id;
    }
    ck.locks[id] = { cardId, priceCardId, random: true };
    locked.push(id);
  }
  ctx.events.push({ type: "lockedRandom", ids: locked, reason: reason || null });
  if (ck.participants.every((id) => ck.locks[id] || !canPlay(st, id))) resolveTrick(ctx);
}

// Privately show a participant the top N cards of the world deck to optionally swap one with an unplayed world card (Afterimage Lens).
export function gmPeekWorld(ctx, { charId, n = 3 }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  participant(ck, charId);
  if (!Number.isInteger(n) || n < 1 || n > 10) throw rule("Peek 1 to 10 world cards.");
  if (!ck.worldDeck.length) throw rule("The world deck is empty.");
  if (ck.pending.some((x) => x.type === "peekWorld" && x.charId === charId)) throw rule("Already peeking the world deck.");
  const cards = ck.worldDeck.slice(-n).reverse().map((c) => c.id);
  ck.pending.push({ type: "peekWorld", charId, cards });
  ctx.events.push({ type: "peekWorldOffered", id: charId, n: cards.length });
}

export function resolvePeekWorld(ctx, { charId, swapWorldId = null, rowIndex = null }) {
  const ck = activeCheck(ctx.state, ["deal", "play", "consolation"]);
  const pi = ck.pending.findIndex((x) => x.type === "peekWorld" && x.charId === charId);
  if (pi < 0) throw rule("There is no world-deck peek to resolve.");
  const prompt = ck.pending[pi];
  let swapped = null;
  if (swapWorldId != null) {
    if (!prompt.cards.includes(swapWorldId)) throw rule("Choose one of the peeked world cards.");
    if (!Number.isInteger(rowIndex) || rowIndex < ck.trick || rowIndex >= ck.worldRow.length) throw rule("Choose an unplayed world card to replace.");
    const di = ck.worldDeck.findIndex((c) => c.id === swapWorldId);
    if (di < 0) throw rule("That card is no longer in the world deck.");
    const out = ck.worldRow[rowIndex];
    const incoming = ck.worldDeck[di];
    ck.worldRow[rowIndex] = incoming;
    ck.worldDeck[di] = out;
    swapped = { index: rowIndex, out: label(out), in: label(incoming) };
  }
  ck.pending.splice(pi, 1);
  ctx.events.push({ type: "worldPeeked", id: charId, swapped });
  advance(ctx);
}

// The GM cancels the running check: every participant goes back to how they were before it began, and
// nothing is recorded. The world deck and row are simply put away.
export function cancelCheck(ctx) {
  const st = ctx.state;
  const ck = st.check;
  if (!ck || ck.phase === "closed") throw rule("No check is running.");
  for (const [id, ch] of Object.entries(ck.before || {})) st.characters[id] = ch;
  st.check = null;
  ctx.events.push({ type: "checkCancelled", id: ck.id });
}

// Shared with legacy.mjs, which replays older saves.
export { activeCheck, participant };
