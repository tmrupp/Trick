// A Tally check, from setup to cleanup (RULES.md: Start a check, Play the tricks, Consolations,
// Statuses, Blessed, Resolve the check, Survival).
import { SUITS, SUIT_INFO, worldCards, isOrdinary, isStatus, isBlessed, label, countsAs } from "./cards.mjs";
import { CHECK_KINDS } from "./rules.mjs";
import { rule, character, drawOwed, gainStatus, returnToReserve, injuriesInTop, scanAfterInjury, moveCard } from "./campaign.mjs";

export { CHECK_KINDS } from "./rules.mjs";

export const RESULT_RANK = { critical: 4, success: 3, partial: 2, failure: 1, bust: 0 };

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
  const players = {};
  for (const id of ids) {
    const ch = st.characters[id];
    // Survival scan at check start, before drawing; a recorded requirement is used as it is.
    if (!ch.survival) {
      const M = injuriesInTop(ch, tricks);
      if (M >= 2) {
        ch.survival = { M, N: tricks };
        ctx.events.push({ type: "survivalRequired", id, M, target: 3 * M, immediate: false });
      }
    }
    players[id] = {
      goal: ch.survival ? "Survive" : null,
      target: ch.survival ? 3 * ch.survival.M : null,
      survival: ch.survival ? { ...ch.survival } : null,
      approach: null, approved: false,
      hand: [], played: [], tally: [],
      brace: 0, mirror: false,
      drawOwed: 0, evolveAsked: false, afterShuffle: null,
    };
  }
  st.check = {
    id: (st.checkCount = (st.checkCount || 0) + 1),
    kind, tricks, participants: seatOrder(st, ids), players,
    situation: situationText(situation),
    phase: "setup", worldRow: [], worldDeck: [], worldTaken: [], trick: 0,
    // Each participant as they were before the check, so the GM can cancel it as if it never began.
    before: Object.fromEntries(ids.map((id) => [id, structuredClone(st.characters[id])])),
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
    if (p.survival && target !== 3 * p.survival.M) throw rule(`Survival is a forced goal at target ${3 * p.survival.M}.`);
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
  if (!w) return [];
  if (mustPlayStatus(p, w)) return p.hand.filter((c) => isStatus(c) && c.suit === w.suit).map((c) => c.id);
  return p.hand.map((c) => c.id);
}

export function lockCard(ctx, { charId, cardId, priceCardId }) {
  const st = ctx.state;
  const ck = activeCheck(st, ["play"]);
  const p = participant(ck, charId);
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) throw rule("That card isn't in your hand.");
  if (!legalCards(st, charId).includes(cardId)) {
    throw rule(`You must play your ${SUIT_INFO[ck.worldRow[ck.trick].suit].status}: the world card is ${SUIT_INFO[ck.worldRow[ck.trick].suit].standard}.`);
  }
  // Stumble's Price: discard an ordinary card from hand, your choice.
  let price = null;
  if (isStatus(card) && card.suit === "D") {
    const ordinaries = p.hand.filter((c) => isOrdinary(c));
    if (ordinaries.length) {
      price = ordinaries.find((c) => c.id === priceCardId);
      if (!price) throw rule("Stumble's Price: choose an ordinary card from your hand to discard.");
    }
  }
  ck.locks[charId] = { cardId, priceCardId: price ? price.id : null };
  ctx.events.push({ type: "locked", id: charId });
  if (ck.participants.every((id) => ck.locks[id] || !ck.players[id].hand.length)) resolveTrick(ctx);
}

export function unlockCard(ctx, { charId }) {
  const ck = activeCheck(ctx.state, ["play"]);
  if (!ck.locks[charId]) throw rule("You haven't locked a card.");
  delete ck.locks[charId];
  ctx.events.push({ type: "unlocked", id: charId });
}

// Who takes the trick (RULES.md, Play the tricks 3–5, and Blessed).
export function trickWinner(w, plays) {
  const blessed = plays.filter((x) => isBlessed(x.card));
  if (blessed.length === 1) return { winner: blessed[0], reason: "blessed" };
  if (blessed.length > 1) return { winner: null, reason: "blessedTie" };
  const wv = w.beat ?? w.v; // a GM adjustment can change what a world card counts for beating
  const top = Math.max(wv, ...plays.map((x) => x.bv));
  if (top <= wv) return { winner: null, reason: "worldHighest" };
  const atTop = plays.filter((x) => x.bv === top);
  if (atTop.length === 1) return atTop[0].onSuit ? { winner: atTop[0], reason: "highest" } : { winner: null, reason: "blocked", by: atTop[0] };
  if (!atTop.every((x) => x.onSuit)) return { winner: null, reason: "blocked", by: atTop.find((x) => !x.onSuit) };
  // Suit, then trump: world suit and own trump > world suit only > own trump only.
  const score = (x) => (x.card.suit === w.suit ? 2 : 0) + (x.card.suit === x.approach ? 1 : 0);
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
      bv: isBlessed(card) ? null : countsAs(card, p.mirror) + p.brace + (p.boost || 0),
      boost: p.boost || 0, brace: p.brace,
      onSuit: !isBlessed(card) && (card.suit === p.approach || card.suit === w.suit),
    });
    p.brace = 0;
    p.mirror = false;
    p.boost = 0;
  }
  const { winner, reason, by } = trickWinner(w, plays);
  let score = 0;
  if (winner) {
    score = w.v;
    ck.players[winner.id].tally.push({ card: w, mirrored: false, score });
  } else ck.worldTaken.push(w);
  for (const x of plays) {
    // A played Blessed returns to its owner's reserve, even if it was given to someone else.
    if (isBlessed(x.card)) returnToReserve(st.characters[x.card.owner] || st.characters[x.id], x.card);
    else ck.players[x.id].played.push(x.card);
  }
  ck.log.push({
    trick: ck.trick, world: w.id, worldLabel: label(w), worldBeat: w.beat ?? w.v,
    plays: plays.map((x) => ({ id: x.id, card: x.card.id, label: label(x.card), bv: x.bv, brace: x.brace, boost: x.boost, onSuit: x.onSuit, mirrored: x.mirrored })),
    winner: winner ? winner.id : null, reason, by: by ? by.id : null, score,
  });
  ctx.events.push({
    type: "trickResolved", trick: ck.trick, world: label(w),
    plays: plays.map((x) => ({ id: x.id, card: label(x.card) })),
    winner: winner ? winner.id : null, reason, by: by ? by.id : null, score,
  });
  // Consolations, all at once, for everyone who did not win; none after the final trick.
  if (!last) {
    // Peek: each player who lost with a Dexterity card chooses, in secret, whether to replace the next world card
    // with the world deck's unseen top card. It is replaced once if any of them chooses to.
    // Saves made while Peek was automatic replay with rules.peek "auto".
    const peekers = plays.filter((x) => x !== winner && !isBlessed(x.card) && x.card.suit === "D").map((x) => x.id);
    if (peekers.length && ck.worldDeck.length) {
      if ((st.rules && st.rules.peek) === "auto") replaceNext(ctx, peekers, ck.trick + 1);
      else {
        ck.peekVotes = [];
        for (const id of peekers) ck.pending.push({ type: "peek", charId: id });
      }
    }
    for (const x of plays) {
      if (x === winner || isBlessed(x.card)) continue;
      const p = ck.players[x.id];
      const s = x.card.suit;
      if (s === "S") p.brace = x.card.v;
      else if (s === "W") p.mirror = true;
      else if (s === "I") { if (p.hand.length) ck.pending.push({ type: "recalculate", charId: x.id }); }
    }
  }
  ck.locks = {};
  ck.trick++;
  ck.phase = last ? "resolve" : "consolation";
  if (last) computeResults(ctx);
  advance(ctx);
}

// Put world row card i on the bottom of the world deck and deal the top card face up in its place.
function replaceNext(ctx, by, i) {
  const ck = ctx.state.check;
  const old = ck.worldRow[i];
  ck.worldRow[i] = ck.worldDeck.pop();
  ck.worldDeck.unshift(old);
  ctx.events.push({ type: "peekReplaced", by, out: label(old), in: label(ck.worldRow[i]) });
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
  const ck = ctx.state.check;
  if (ck.pending.length) return;
  if (ck.phase === "deal" || ck.phase === "consolation") {
    ck.phase = "play";
    ctx.events.push({ type: "trickReady", trick: ck.trick, world: label(ck.worldRow[ck.trick]) });
    // Anyone with an empty hand sits out; if nobody can play, the world takes the trick.
    if (ck.participants.every((id) => !ck.players[id].hand.length)) resolveTrick(ctx);
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

// The GM records consequence statuses before cleanup; they go on top of discard, Injuries last.
export function addConsequence(ctx, { charId, suit, compulsion }) {
  const ck = activeCheck(ctx.state, ["resolve"]);
  participant(ck, charId);
  if (!SUITS.includes(suit)) throw rule("Name the status by its suit: S, D, I or W.");
  const ch = ctx.state.characters[charId];
  const curseNamed = ch.compulsion.length || ck.consequences.some((c) => c.charId === charId && c.suit === "W" && c.compulsion);
  if (suit === "W" && !compulsion && !curseNamed) throw rule("A first Curse needs its compulsion.");
  ck.consequences.push({ charId, suit, compulsion: compulsion || null });
  ctx.events.push({ type: "consequenceAdded", id: charId, status: SUIT_INFO[suit].status });
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
    ctx.rng.shuffle(p.hand);
    ch.discard.push(...p.hand); // unplayed cards, shuffled together
    p.hand = [];
    ch.discard.push(...p.played); // the played row, earliest to latest
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
  const ck = activeCheck(ctx.state);
  const p = participant(ck, charId);
  if (!Number.isInteger(delta) || !delta) throw rule("Adjust the tally by a whole number.");
  p.tally.push({ card: null, adjustment: true, mirrored: false, score: delta, reason: reason || null });
  if (ck.phase === "resolve") computeResults(ctx);
  ctx.events.push({ type: "tallyAdjusted", id: charId, delta, reason: reason || null });
}

export function gmAdjustTarget(ctx, { charId, target, reason }) {
  const ck = activeCheck(ctx.state);
  const p = participant(ck, charId);
  if (!Number.isInteger(target) || target < 1) throw rule("A target is a whole number of at least 1.");
  p.target = target;
  if (ck.phase === "resolve") computeResults(ctx);
  ctx.events.push({ type: "targetAdjusted", id: charId, target, reason: reason || null });
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
