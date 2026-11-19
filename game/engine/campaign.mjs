// Characters and everything that happens to their cards between and around checks:
// creation, statuses, Curses, rest, Blessed grants, drawing, reshuffles, evolution and survival scans.
import { SUITS, SUIT_INFO, STATUSES_PER_SUIT, buildStarter, isOrdinary, isStatus, isBlessed, label } from "./cards.mjs";

export class RuleError extends Error {
  constructor(message) { super(message); this.name = "RuleError"; }
}
export const rule = (message) => new RuleError(message);

export function character(state, id) {
  const ch = state.characters[id];
  if (!ch) throw rule(`There is no character "${id}".`);
  return ch;
}

const take = (pile, pred) => { const i = pile.findIndex(pred); return i < 0 ? null : pile.splice(i, 1)[0]; };

// bot: null for a person; "greedy" (goes for any world card it can take without busting) or "ltr" (left to right:
// plays its leftmost card each trick, with its hand face up for everyone, like the Wake Lantern's dead hand).
export function createCharacter(ctx, { id, name, primary, secondary, others, controller = "player", race = null, bot = null }) {
  const st = ctx.state;
  if (!id || !/^[A-Za-z0-9_-]{1,32}$/.test(id)) throw rule("A character needs an id of letters, digits, - or _.");
  if (st.characters[id]) throw rule(`A character "${id}" already exists.`);
  const suits = [primary, secondary, ...(others || [])];
  if (suits.length !== 4 || suits.some((s) => !SUITS.includes(s)) || new Set(suits).size !== 4) {
    throw rule("Choose a primary suit, a different secondary suit, and which other suit takes 2, 3, 6, 9.");
  }
  if (race != null && !/^[a-z0-9-]{1,40}$/.test(race)) throw rule("Unknown people.");
  if (bot != null && !["greedy", "ltr"].includes(bot)) throw rule("A bot is greedy or ltr (left to right).");
  const { deck, reserve } = buildStarter(id, primary, secondary, others);
  ctx.rng.shuffle(deck);
  st.characters[id] = {
    id, name: name || id, controller, primary, secondary, others,
    deck, discard: [], reserve, alive: true,
    compulsion: [], // the terms of the shared Curse compulsion
    survival: null, // a recorded survival requirement: { M, N }
    race: race || null,
    items: [], // item ids from items/item_catalog.js
    bot: bot || null,
  };
  if (!st.seats.includes(id)) st.seats.push(id);
  ctx.events.push({ type: "characterCreated", id, name: name || id });
}

export function cursesOut(ch) {
  return STATUSES_PER_SUIT - ch.reserve.filter((c) => isStatus(c) && c.suit === "W").length;
}

// Gain a status from reserve into discard. Returns the card, or null if none remain.
export function gainStatus(ctx, ch, suit, compulsion) {
  const card = take(ch.reserve, (c) => isStatus(c) && c.suit === suit);
  if (!card) { ctx.events.push({ type: "statusUnavailable", id: ch.id, status: SUIT_INFO[suit].status }); return null; }
  ch.discard.push(card);
  if (suit === "W" && compulsion) ch.compulsion.push(String(compulsion));
  ctx.events.push({ type: "statusGained", id: ch.id, status: SUIT_INFO[suit].status, compulsion: compulsion || null });
  return card;
}

// Return a status to reserve from wherever it is; ends the compulsion with the last Curse.
export function returnToReserve(ch, card) {
  ch.reserve.push(card);
  if (isStatus(card) && card.suit === "W" && cursesOut(ch) === 0) ch.compulsion = [];
}

// Injuries among the top N discard cards, or all cards if fewer exist.
export function injuriesInTop(ch, N) {
  return ch.discard.slice(-N).filter((c) => isStatus(c) && c.suit === "S").length;
}

// Gain-triggered survival scan: N is the most recently completed check's tricks.
export function scanAfterInjury(ctx, ch) {
  if (!ch.alive || ch.survival) return;
  const N = ctx.state.lastCheckTricks || ch.discard.length;
  const M = injuriesInTop(ch, N);
  if (M >= 2) {
    ch.survival = { M, N };
    ctx.events.push({ type: "survivalRequired", id: ch.id, M, target: 3 * M, immediate: true });
  }
}

export function gainStatusBetweenChecks(ctx, { charId, suit, compulsion }) {
  const st = ctx.state;
  if (st.check && st.check.phase !== "closed") throw rule("Statuses gained during a check wait for cleanup: add them as consequences.");
  if (!SUITS.includes(suit)) throw rule("Name the status by its suit: S, D, I or W.");
  const ch = character(st, charId);
  if (suit === "W" && !compulsion && ch.compulsion.length === 0) throw rule("A first Curse needs its compulsion.");
  const card = gainStatus(ctx, ch, suit, compulsion);
  if (card && suit === "S") scanAfterInjury(ctx, ch);
}

export function curseViolation(ctx, { charId }) {
  const ch = character(ctx.state, charId);
  const n = cursesOut(ch);
  if (!n) throw rule(`${ch.name} has no Curse.`);
  for (let i = 0; i < n; i++) gainStatus(ctx, ch, "I");
  ctx.events.push({ type: "curseViolated", id: ch.id, stress: n });
}

// A GM-granted rest: remove any number of non-Curse statuses from discard.
export function rest(ctx, { charId, cardIds }) {
  const st = ctx.state;
  if (st.check && st.check.phase !== "closed") throw rule("Rest happens between checks.");
  const ch = character(st, charId);
  for (const cid of cardIds || []) {
    const card = take(ch.discard, (c) => c.id === cid);
    if (!card) throw rule("Rest removes cards from your discard.");
    if (!isStatus(card) || card.suit === "W") { ch.discard.push(card); throw rule("Rest removes non-Curse statuses only."); }
    returnToReserve(ch, card);
  }
  ctx.events.push({ type: "rested", id: ch.id, removed: (cardIds || []).length });
}

// The GM renames a character.
export function renameCharacter(ctx, { charId, name }) {
  const ch = character(ctx.state, charId);
  const clean = String(name || "").trim().slice(0, 24);
  if (!clean) throw rule("Give them a name.");
  const old = ch.name;
  ch.name = clean;
  ctx.events.push({ type: "renamed", id: ch.id, from: old, to: clean });
}

// The GM retires a character: they stay in the campaign's history but take no part in checks until brought back.
export function retireCharacter(ctx, { charId, retired = true }) {
  const st = ctx.state;
  const ch = character(st, charId);
  if (st.check && st.check.phase !== "closed" && st.check.players[charId]) throw rule(`${ch.name} is in this check; cancel or finish it first.`);
  ch.retired = !!retired;
  ctx.events.push({ type: retired ? "retired" : "unretired", id: ch.id });
}

// The GM brings a dead character back. Their cards stay as they were, so a survival scan may come up again.
export function resurrect(ctx, { charId }) {
  const st = ctx.state;
  const ch = character(st, charId);
  if (ch.alive) throw rule(`${ch.name} is alive.`);
  if (st.check && st.check.phase !== "closed") throw rule("Bring a character back between checks.");
  ch.alive = true;
  ch.survival = null;
  ctx.events.push({ type: "resurrected", id: ch.id });
}

// The GM grants a Blessed: it moves from reserve to the top of the deck.
export function grantBlessed(ctx, { charId }) {
  const ch = character(ctx.state, charId);
  const card = take(ch.reserve, isBlessed);
  if (!card) throw rule(`${ch.name} has no Blessed left in reserve.`);
  ch.deck.push(card);
  ctx.events.push({ type: "blessedGranted", id: ch.id });
}

// ---- Drawing, reshuffles and evolution ----

// Suits in which the discard holds two statuses: evolution is possible on a shuffle.
export function evolutionSuits(ch) {
  return SUITS.filter((s) => ch.discard.filter((c) => isStatus(c) && c.suit === s).length >= 2);
}

// Draw the cards owed to a check participant (p.drawOwed). Stops to ask about evolution when a reshuffle
// could evolve; the evolve action resumes it.
export function drawOwed(ctx, ch, p) {
  const ck = ctx.state.check;
  while (p.drawOwed > 0) {
    if (!ch.deck.length) {
      if (!ch.discard.length) { p.drawOwed = 0; break; }
      if (!p.evolveAsked && evolutionSuits(ch).length) {
        p.evolveAsked = true;
        ck.pending.push({ type: "evolve", charId: ch.id, suits: evolutionSuits(ch) });
        ctx.events.push({ type: "evolveOffered", id: ch.id });
        return;
      }
      reshuffle(ctx, ch, p);
    }
    const card = ch.deck.pop();
    p.hand.push(card);
    p.drawOwed--;
    if (isStatus(card) && card.suit === "I") gainStatus(ctx, ch, "I"); // drawing Stress gains another
  }
}

function reshuffle(ctx, ch, p) {
  ch.deck = ctx.rng.shuffle(ch.discard);
  ch.discard = [];
  p.evolveAsked = false;
  // Mid-check evolution: cards set aside before the shuffle land on top of the new discard.
  if (p.afterShuffle) { ch.discard.push(...p.afterShuffle); p.afterShuffle = null; }
  ctx.events.push({ type: "reshuffled", id: ch.id, deck: ch.deck.length });
}

// Evolve, or skip, on the reshuffle the draw is waiting for.
// { skip: true } | { suit, mode: "gain" } | { suit, mode: "return", cardId }
export function evolve(ctx, { charId, skip, suit, mode, cardId }) {
  const ck = ctx.state.check;
  const pi = ck ? ck.pending.findIndex((x) => x.type === "evolve" && x.charId === charId) : -1;
  if (pi < 0) throw rule("There is no evolution to decide.");
  const ch = character(ctx.state, charId);
  const p = ck.players[charId];
  if (!skip) {
    if (!evolutionSuits(ch).includes(suit)) throw rule("Evolve needs two statuses of the same suit in your discard.");
    if (mode !== "gain" && mode !== "return") throw rule("Evolve by gaining a card or returning one.");
    let back = null;
    if (mode === "return") {
      back = ch.discard.find((c) => c.id === cardId && isOrdinary(c) && c.suit === suit);
      if (!back) throw rule("Return an ordinary card of that suit from your discard.");
    }
    const s1 = take(ch.discard, (c) => isStatus(c) && c.suit === suit);
    const s2 = take(ch.discard, (c) => isStatus(c) && c.suit === suit);
    returnToReserve(ch, s1);
    const keep = [s2];
    if (back) { ch.discard.splice(ch.discard.indexOf(back), 1); ch.reserve.push(back); }
    // In preparation the other status stays in discard and shuffles in; mid-check it is set aside first.
    if (ck.phase === "deal") ch.discard.push(...keep);
    else p.afterShuffle = keep;
    if (mode === "gain") {
      const pool = ch.reserve.filter((c) => isOrdinary(c) && c.suit === suit);
      ctx.rng.shuffle(pool);
      const options = pool.slice(0, 3).map((c) => c.id);
      if (options.length) {
        // In preparation the kept card joins the discard before the shuffle, so the draw waits for the pick.
        const beforeShuffle = ck.phase === "deal";
        ck.pending.push({ type: "evolvePick", charId, options, beforeShuffle });
        ctx.events.push({ type: "evolved", id: charId, suit, mode });
        if (beforeShuffle) { ck.pending.splice(pi, 1); p.evolveAsked = true; return; }
      }
    } else ctx.events.push({ type: "evolved", id: charId, suit, mode });
  }
  ck.pending.splice(pi, 1);
  p.evolveAsked = true; // decided for this shuffle
  if (!ch.deck.length && ch.discard.length) reshuffle(ctx, ch, p);
  drawOwed(ctx, ch, p);
}

// Keep one of the three cards drawn by evolution; the rest return to reserve.
export function evolvePick(ctx, { charId, cardId }) {
  const ck = ctx.state.check;
  const pi = ck ? ck.pending.findIndex((x) => x.type === "evolvePick" && x.charId === charId) : -1;
  if (pi < 0) throw rule("There is no evolution card to choose.");
  const prompt = ck.pending[pi];
  if (!prompt.options.includes(cardId)) throw rule("Choose one of the cards you drew.");
  const ch = character(ctx.state, charId);
  const card = take(ch.reserve, (c) => c.id === cardId);
  ch.discard.push(card);
  ck.pending.splice(pi, 1);
  ctx.events.push({ type: "evolveKept", id: charId, card: label(card) });
  if (prompt.beforeShuffle) {
    const p = ck.players[charId];
    if (!ch.deck.length && ch.discard.length) reshuffle(ctx, ch, p);
    drawOwed(ctx, ch, p);
  }
}

// ---- Items (items/item_catalog.js). Their effects are applied by the GM with the adjustment actions. ----

const ITEM_ID = /^[a-z0-9-]{1,48}$/;

export function giveItem(ctx, { charId, itemId }) {
  const ch = character(ctx.state, charId);
  if (!ITEM_ID.test(itemId || "")) throw rule("Unknown item.");
  if (ch.items.includes(itemId)) throw rule(`${ch.name} already has that item.`);
  ch.items.push(itemId);
  ctx.events.push({ type: "itemGiven", id: charId, itemId });
}

export function loseItem(ctx, { charId, itemId }) {
  const ch = character(ctx.state, charId);
  const i = ch.items.indexOf(itemId);
  if (i < 0) throw rule(`${ch.name} doesn't have that item.`);
  ch.items.splice(i, 1);
  ctx.events.push({ type: "itemLost", id: charId, itemId });
}

// A player wakes or uses an item: everyone sees it, and the GM applies its effect and cost.
export function useItem(ctx, { charId, itemId, note }) {
  const ch = character(ctx.state, charId);
  if (!ch.items.includes(itemId)) throw rule("You don't have that item.");
  ctx.events.push({ type: "itemUsed", id: charId, itemId, note: note ? String(note).slice(0, 120) : null });
}
