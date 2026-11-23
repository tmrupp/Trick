// What each screen may see. The server sends every client only its own view.
//   viewFor(state, { role: "table" })            the big screen: public information only
//   viewFor(state, { role: "player", charId })    one player's phone: the table plus their own hand and prompts
//   viewFor(state, { role: "gm" })                the GM: everything except the order of unseen decks
import { label, isStatus } from "./cards.mjs";
import { survivalTarget, pendingList } from "./campaign.mjs";
import { legalCards, bustSitOut, isBusted } from "./check.mjs";
import { legacyItem } from "./legacy.mjs";

const pub = (c) => (c ? {
  id: c.id, label: label(c), suit: c.suit || null, v: c.v, status: !!c.status, blessed: !!c.blessed,
  ...(c.beat != null ? { beat: c.beat } : {}),
  ...(c.beatDelta ? { beatDelta: c.beatDelta } : {}),
  ...(c.pinned ? { pinned: true } : {}),
} : null);

// An item as a screen sees it. Cards tucked beneath it face down show only to its holder and the GM (full);
// everyone else sees that a card is there (null).
function pubItem(raw, full) {
  const it = legacyItem(raw);
  return {
    id: it.id, itemId: it.itemId || null, label: it.label || null, text: it.text || null,
    qty: it.qty || 1, charges: it.charges || 0, revealed: !!it.revealed, note: it.note || "",
    tucked: (it.tucked || []).map((c) => (full || c.tuckFaceUp ? { ...pub(c), faceUp: !!c.tuckFaceUp } : null)),
  };
}

function characterPublic(ch, state, full = false) {
  return {
    id: ch.id, name: ch.name, alive: ch.alive, retired: !!ch.retired, controller: ch.controller, bot: ch.bot || null, race: ch.race || null,
    items: (ch.items || []).map((it) => pubItem(it, full)),
    primary: ch.primary, secondary: ch.secondary,
    deckCount: ch.deck.length, discardCount: ch.discard.length,
    discardTop: pub(ch.discard[ch.discard.length - 1]),
    compulsion: ch.compulsion.slice(),
    survival: ch.survival ? { ...ch.survival, target: survivalTarget(state, ch.survival.M) } : null,
  };
}

function characterPrivate(ch, state) {
  const statuses = {};
  for (const c of ch.reserve) if (isStatus(c)) statuses[c.suit] = (statuses[c.suit] || 0) + 1;
  return {
    ...characterPublic(ch, state, true),
    discard: ch.discard.map(pub),
    // The deck's contents, never its order.
    deckCards: ch.deck.map(pub).sort((a, b) => (a.blessed - b.blessed) || (a.status - b.status) || String(a.suit).localeCompare(String(b.suit)) || a.v - b.v),
    reserveCount: ch.reserve.length,
    reserveCards: ch.reserve.map(pub).sort((a, b) => (a.blessed - b.blessed) || (a.status - b.status) || String(a.suit).localeCompare(String(b.suit)) || a.v - b.v),
    reserveStatuses: statuses,
    reserveBlessed: ch.reserve.filter((c) => c.blessed).length,
  };
}

function checkPublic(ck, state, who) {
  if (!ck) return null;
  const players = {};
  for (const id of ck.participants) {
    const p = ck.players[id];
    const seesPrivate = who.role === "gm" || (who.role === "player" && who.charId === id);
    players[id] = {
      goal: p.goal, target: p.target, suggested: p.suggested ?? null, survival: p.survival,
      approach: p.approach, approachText: p.approachText || null, approved: p.approved,
      handCount: p.hand.length, played: p.played.map(pub),
      aside: (p.aside || []).map((a) => ({ card: a.faceUp || seesPrivate ? pub(a.card) : null, faceUp: !!a.faceUp, setAtTrick: a.setAtTrick, tag: a.tag || null })),
      pinnedCards: p.hand.filter((c) => c.pinned).map(pub),
      cardRules: (p.cardRules || []).map((r) => ({ ...r })),
      tally: p.tally.map((t) => ({ card: pub(t.card), mirrored: t.mirrored, score: t.score, shave: t.shave || 0, adjustment: !!t.adjustment, reason: t.reason || null })),
      boost: p.boost || 0,
      total: p.tally.reduce((a, t) => a + t.score, 0),
      busted: !!(bustSitOut(state) && isBusted(p)),
      sitOut: !!p.sitOut,
      brace: p.brace, mirror: p.mirror, shave: p.shave || 0,
      locked: !!ck.locks[id],
      // A left-to-right bot plays with its hand face up, in order: the leftmost card plays next.
      openHand: state.characters[id] && state.characters[id].bot === "ltr" ? p.hand.map(pub) : null,
    };
  }
  return {
    id: ck.id, kind: ck.kind, tricks: ck.tricks, participants: ck.participants.slice(),
    situation: ck.situation || null,
    phase: ck.phase, trick: ck.trick,
    worldRow: ck.worldRow.map((c) => ({ ...pub(c), beat: c.beat ?? null, shave: c.shave || 0, worldCannotWin: !!c.worldCannotWin, invert: !!c.invert })),
    worldDeckCount: ck.worldDeck.length,
    worldTaken: ck.worldTaken.map(pub),
    players,
    waitingOn: ck.pending.map((x) => ({ type: x.type, charId: x.charId })),
    log: ck.log.slice(),
    results: ck.results,
    consequences: ck.consequences.slice(),
  };
}

function hydratePrompt(state, x) {
  const out = { ...x };
  const ch = state.characters[x.charId];
  if (x.type === "evolvePick" && ch) out.options = x.options.map((id) => pub(ch.reserve.find((c) => c.id === id)));
  if (x.type === "peekDeck" && ch) out.cards = x.cards.map((id) => pub(ch.deck.find((c) => c.id === id))).filter(Boolean);
  if (x.type === "peekWorld" && state.check) out.cards = x.cards.map((id) => pub(state.check.worldDeck.find((c) => c.id === id))).filter(Boolean);
  return out;
}

// Journal entries that name a character's cards: only the GM and that character's player see them,
// as when they happen (room.viewMessage). who.charIds lists every character a player has had; else who.charId.
const PRIVATE_JOURNAL = new Set(["gmCardAdded", "gmCardMoved", "cardTucked", "cardUntucked"]);
function journalFor(state, who) {
  const mine = (id) => who.role === "gm" || (who.role === "player" && (who.charIds || [who.charId]).includes(id));
  return (state.journal || []).filter((e) => !PRIVATE_JOURNAL.has(e.type) || mine(e.id)).map((e) => ({ ...e }));
}

// itemPrices: { itemId: lines } from the host (game/server/items.mjs). A Relic's Price is hidden information: the GM
// gets every one, everyone else only the Prices the GM has revealed.
export function viewFor(state, who, { itemPrices = {} } = {}) {
  const view = {
    seats: state.seats.slice(), gmSeat: state.gmSeat,
    rules: { ...(state.rules || {}) }, // which consolations this game uses (older games keep Peek)
    characters: {},
    check: checkPublic(state.check, state, who),
    history: state.history.map((h) => ({ id: h.id, kind: h.kind, tricks: h.tricks, situation: h.situation || null, results: h.results, log: h.log || [], players: h.players || null, consequences: h.consequences || [] })),
    journal: journalFor(state, who),
    itemPrices: {},
  };
  for (const ch of Object.values(state.characters)) {
    for (const raw of ch.items || []) {
      const it = legacyItem(raw);
      if (it.itemId && itemPrices[it.itemId] && (who.role === "gm" || it.revealed)) view.itemPrices[it.itemId] = itemPrices[it.itemId].slice();
    }
  }
  if (who.role === "gm") for (const [id, lines] of Object.entries(itemPrices)) view.itemPrices[id] = lines.slice();
  for (const ch of Object.values(state.characters)) {
    view.characters[ch.id] = who.role === "gm" || (who.role === "player" && who.charId === ch.id) ? characterPrivate(ch, state) : characterPublic(ch, state);
  }
  const ck = state.check;
  const active = ck && ck.phase !== "closed";
  const allPending = active ? ck.pending : (state.betweenPending || []);
  if (who.role === "gm") {
    view.pending = allPending.map((x) => hydratePrompt(state, x));
  }
  if (who.role === "player" && who.charId) {
    view.prompts = allPending.filter((x) => x.charId === who.charId).map((x) => hydratePrompt(state, x));
  }
  if (active) {
    if (who.role === "gm") {
      view.hands = Object.fromEntries(ck.participants.map((id) => [id, ck.players[id].hand.map(pub)]));
      view.locks = Object.fromEntries(Object.entries(ck.locks).map(([id, l]) => [id, { ...l }]));
      view.legal = Object.fromEntries(ck.participants.map((id) => [id, ck.phase === "play" ? legalCards(state, id) : []]));
    }
    if (who.role === "player" && ck.players[who.charId]) {
      const p = ck.players[who.charId];
      view.hand = p.hand.map(pub);
      view.legal = ck.phase === "play" ? legalCards(state, who.charId) : [];
      view.myLock = ck.locks[who.charId] || null;
    }
  }
  return view;
}
