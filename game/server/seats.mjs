// Seats: who plays which character. Pure functions over a save's seats, so the rules about seats live in one place.
// A seat has a role ("player", "gm" or "bot"), the character it plays now (charId), the others it has made or
// played (chars), and may be removed. Rooms call these; nothing else edits seats.

// A seat's characters: the one it plays now and any others it has made or played.
export const charsOf = (seat) => [...new Set([...(seat.chars || []), ...(seat.charId ? [seat.charId] : [])])];

export const liveSeats = (save) => save.seats.filter((s) => !s.removed);

// Characters someone is playing right now: only these can take part in a check.
export const playedCharacters = (save) => new Set(liveSeats(save).filter((s) => s.charId).map((s) => s.charId));

// Player seats with a character and no phone connected: a player returning on a new browser can take one back.
export function returningSeats(save, state, connectedSeatIds) {
  return liveSeats(save)
    .filter((s) => s.role === "player" && s.charId && !connectedSeatIds.has(s.id) && state.characters[s.charId])
    .map((s) => ({ seatId: s.id, name: s.name, character: state.characters[s.charId].name }));
}

// A seat starts playing a character it owns (or has just made).
export function playCharacter(seat, charId) {
  seat.chars = [...charsOf(seat), charId];
  seat.charId = charId;
}

// Hand a character to a seat: it leaves its old seat, and a player seat left with no characters is removed.
// Returns the seats that were removed.
export function assignCharacter(save, target, charId) {
  const removed = [];
  for (const s of save.seats) {
    if (s === target || !charsOf(s).includes(charId)) continue;
    s.chars = charsOf(s).filter((id) => id !== charId);
    if (s.charId === charId) s.charId = s.chars[s.chars.length - 1] || null;
    if (s.role === "player" && !s.chars.length) { s.removed = true; removed.push(s); }
  }
  playCharacter(target, charId);
  return removed;
}

// The next free id for a seat of a role: p1, p2… for players, b1, b2… for bots. Removed seats keep their numbers.
export function nextSeatId(save, role) {
  const prefix = role === "bot" ? "b" : "p";
  return `${prefix}${save.seats.filter((s) => s.role === role).length + 1}`;
}
