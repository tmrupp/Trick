// What each screen may see. The server sends every client only its own view.
//   viewFor(state, { role: "table" })            the big screen: public information only
//   viewFor(state, { role: "player", charId })    one player's phone: the table plus their own hand and prompts
//   viewFor(state, { role: "gm" })                the GM: everything except the order of unseen decks
import { label, isStatus } from "./cards.mjs";
import { legalCards } from "./check.mjs";

const pub = (c) => (c ? { id: c.id, label: label(c), suit: c.suit || null, v: c.v, status: !!c.status, blessed: !!c.blessed } : null);

function characterPublic(ch) {
  return {
    id: ch.id, name: ch.name, alive: ch.alive, controller: ch.controller,
    primary: ch.primary, secondary: ch.secondary,
    deckCount: ch.deck.length, discardCount: ch.discard.length,
    discardTop: pub(ch.discard[ch.discard.length - 1]),
    compulsion: ch.compulsion.slice(),
    survival: ch.survival ? { ...ch.survival, target: 3 * ch.survival.M } : null,
  };
}

function characterPrivate(ch) {
  const statuses = {};
  for (const c of ch.reserve) if (isStatus(c)) statuses[c.suit] = (statuses[c.suit] || 0) + 1;
  return {
    ...characterPublic(ch),
    discard: ch.discard.map(pub),
    reserveCount: ch.reserve.length,
    reserveStatuses: statuses,
    reserveBlessed: ch.reserve.filter((c) => c.blessed).length,
  };
}

function checkPublic(ck) {
  if (!ck) return null;
  const players = {};
  for (const id of ck.participants) {
    const p = ck.players[id];
    players[id] = {
      goal: p.goal, target: p.target, survival: p.survival,
      approach: p.approach, approachText: p.approachText || null, approved: p.approved,
      handCount: p.hand.length, played: p.played.map(pub),
      tally: p.tally.map((t) => ({ card: pub(t.card), mirrored: t.mirrored, score: t.score })),
      total: p.tally.reduce((a, t) => a + t.score, 0),
      brace: p.brace, mirror: p.mirror,
      locked: !!ck.locks[id],
    };
  }
  return {
    id: ck.id, kind: ck.kind, tricks: ck.tricks, participants: ck.participants.slice(),
    phase: ck.phase, trick: ck.trick,
    worldRow: ck.worldRow.map(pub),
    worldDeckCount: ck.worldDeck.length,
    worldTaken: ck.worldTaken.map(pub),
    players,
    waitingOn: ck.pending.map((x) => ({ type: x.type, charId: x.charId })),
    log: ck.log.slice(),
    results: ck.results,
    consequences: ck.consequences.slice(),
  };
}

export function viewFor(state, who) {
  const view = {
    seed: who.role === "gm" ? state.seed : undefined,
    seats: state.seats.slice(), gmSeat: state.gmSeat,
    characters: {},
    check: checkPublic(state.check),
    history: state.history.map((h) => ({ id: h.id, kind: h.kind, results: h.results })),
  };
  for (const ch of Object.values(state.characters)) {
    view.characters[ch.id] = who.role === "gm" || (who.role === "player" && who.charId === ch.id) ? characterPrivate(ch) : characterPublic(ch);
  }
  const ck = state.check;
  if (ck && ck.phase !== "closed") {
    if (who.role === "gm") {
      view.hands = Object.fromEntries(ck.participants.map((id) => [id, ck.players[id].hand.map(pub)]));
      view.locks = Object.fromEntries(Object.entries(ck.locks).map(([id, l]) => [id, { ...l }]));
      view.pending = ck.pending.map((x) => ({ ...x }));
    }
    if (who.role === "player" && ck.players[who.charId]) {
      const p = ck.players[who.charId];
      view.hand = p.hand.map(pub);
      view.legal = ck.phase === "play" ? legalCards(state, who.charId) : [];
      view.myLock = ck.locks[who.charId] || null;
      view.prompts = ck.pending.filter((x) => x.charId === who.charId).map((x) => {
        const out = { ...x };
        // Only the active Peek sees the world deck's top card.
        if (x.type === "peek") out.top = ck.pending.find((y) => y.type === "peek") === x ? pub(ck.worldDeck[ck.worldDeck.length - 1]) : null;
        if (x.type === "evolvePick") out.options = x.options.map((id) => pub(state.characters[who.charId].reserve.find((c) => c.id === id)));
        return out;
      });
    }
  }
  return view;
}
