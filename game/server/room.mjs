// A room: one loaded campaign, its seats, and the sockets watching it.
import { apply, replay, viewFor, RuleError } from "../engine/index.mjs";
import { newSecret } from "./store.mjs";

const MAX_SEATS = 10;

// What a player seat may do: act for its own character only. The GM may do anything.
const PLAYER_ACTIONS = new Set(["createCharacter", "declareApproach", "lockCard", "unlockCard", "recalculate", "peek", "giveBlessed", "evolve", "evolvePick", "useItem"]);

export function authorize(seat, action) {
  if (seat.role === "gm") return;
  if (!PLAYER_ACTIONS.has(action.type)) throw new RuleError("Only the GM can do that.");
  if (action.type === "createCharacter") return; // the room checks the seat isn't mid-check
  if (!seat.charId) throw new RuleError("Create your character first.");
  if (action.charId !== seat.charId) throw new RuleError("You can only act for your own character.");
}

// A seat's characters: the one it plays now (charId) and any others it has made or played.
export const charsOf = (seat) => [...new Set([...(seat.chars || []), ...(seat.charId ? [seat.charId] : [])])];

export class Room {
  constructor(save, store, linkBase = () => "") {
    this.save = save;
    this.store = store;
    this.linkBase = linkBase;
    try {
      this.state = replay({ seed: save.seed, gmSeat: save.gmSeat, rules: save.rules }, save.actions);
    } catch (e) {
      // Saves from while Peek happened automatically won't replay with the Peek choice: keep them on that rule.
      if (save.rules) throw e;
      this.state = replay({ seed: save.seed, gmSeat: save.gmSeat, rules: { peek: "auto" } }, save.actions);
      save.rules = { peek: "auto" };
    }
    this.clients = new Set(); // { ws, seat | null, as }
  }

  get code() { return this.save.code; }

  seatById(id) { return this.save.seats.find((s) => s.id === id); }

  // Player seats with a character and no phone connected: someone returning on a new browser or link can take one back.
  returning() {
    const connected = new Set([...this.clients].filter((c) => c.seat).map((c) => c.seat.id));
    return this.save.seats
      .filter((s) => s.role === "player" && !s.removed && s.charId && !connected.has(s.id) && this.state.characters[s.charId])
      .map((s) => ({ seatId: s.id, name: s.name, character: this.state.characters[s.charId].name }));
  }

  // Join or rejoin. Returns the seat (null for a table screen).
  join({ as, token, name, gmKey, reclaim }) {
    if (as === "table") return null;
    if (as === "gm") {
      if (gmKey !== this.save.gmKey) throw new RuleError("That GM link isn't valid for this room.");
      let seat = this.save.seats.find((s) => s.role === "gm");
      if (!seat) {
        seat = { id: "gm", token: newSecret(), name: name || "GM", role: "gm", charId: null };
        this.save.seats.push(seat);
        this.persist();
      }
      return seat;
    }
    if (token) {
      const seat = this.save.seats.find((s) => s.token === token && s.role === "player");
      if (seat && !seat.removed) return seat;
      if (seat && seat.removed) throw new RuleError("The GM removed this seat.");
    }
    if (reclaim) {
      // A new token goes to the new browser; the old one stops working.
      const seat = this.returning().some((r) => r.seatId === reclaim) && this.seatById(reclaim);
      if (!seat) throw new RuleError("That character is already connected, or isn't in this room.");
      seat.token = newSecret();
      this.persist();
      return seat;
    }
    const clean = String(name || "").trim().slice(0, 24);
    if (!clean) throw new RuleError("Enter your name to join.");
    if (this.save.seats.filter((s) => s.role === "player" && !s.removed).length >= MAX_SEATS) throw new RuleError("This room is full.");
    const n = this.save.seats.filter((s) => s.role === "player").length + 1; // removed seats keep their numbers
    const seat = { id: `p${n}`, token: newSecret(), name: clean, role: "player", charId: null };
    this.save.seats.push(seat);
    this.persist();
    return seat;
  }

  // Apply an action for a seat; on success persist and broadcast.
  act(seat, action) {
    if (!action || typeof action !== "object") throw new RuleError("Send an action.");
    if (seat && seat.removed) throw new RuleError("The GM removed this seat.");
    if (!seat) throw new RuleError("A table screen can't act.");
    authorize(seat, action);
    let a = { ...action };
    if (a.type === "createCharacter") {
      if (seat.charId && this.inCheck(seat.charId)) throw new RuleError("Finish this check before making a new character.");
      // The server names the character after its seat (p1, then p1-2, p1-3…), so ids never collide.
      const base = seat.role === "gm" ? "gm" : seat.id;
      let id = base;
      for (let n = 2; this.state.characters[id]; n++) id = `${base}-${n}`;
      a = { type: "createCharacter", id, name: String(a.name || seat.name).slice(0, 24), primary: a.primary, secondary: a.secondary, others: a.others, race: a.race || null, controller: seat.role };
    }
    const { state, events } = apply(this.state, a);
    this.state = state;
    this.save.actions = state.actions;
    if (a.type === "createCharacter") { seat.chars = [...charsOf(seat), a.id]; seat.charId = a.id; }
    this.save.characterNames = Object.values(state.characters).map((c) => c.name);
    this.persist();
    this.broadcast(events);
    return events;
  }

  inCheck(charId) {
    const ck = this.state.check;
    return !!(ck && ck.phase !== "closed" && ck.players[charId]);
  }

  // Seat management, outside the engine. Any seat may switch between its own characters; the rest is the GM's.
  manage(seat, op) {
    if (seat && op.op === "switch") {
      if (!charsOf(seat).includes(op.charId) || !this.state.characters[op.charId]) throw new RuleError("That isn't one of your characters.");
      if (seat.charId && seat.charId !== op.charId && this.inCheck(seat.charId)) throw new RuleError("Finish this check before switching characters.");
      seat.chars = charsOf(seat);
      seat.charId = op.charId;
      this.persist();
      this.broadcast([{ type: "seatSwitched", seatId: seat.id, charId: op.charId }]);
      return;
    }
    if (!seat || seat.role !== "gm") throw new RuleError("Only the GM can manage seats.");
    if (op.op === "remove") {
      const target = this.seatById(op.seatId);
      if (!target || target.role === "gm") throw new RuleError("No such player seat.");
      target.removed = true;
      for (const c of this.clients) if (c.seat === target) { c.send({ type: "removed" }); c.close(); }
      this.persist();
      this.broadcast([{ type: "seatRemoved", seatId: target.id }]);
      return;
    }
    // Hand a character to another seat, e.g. a player who rejoined on a new phone or a new host.
    if (op.op === "assign") {
      const target = this.seatById(op.seatId);
      if (!target || target.removed || target.role !== "player") throw new RuleError("Choose a player seat.");
      if (target.charId && this.inCheck(target.charId)) throw new RuleError("That seat is in a check.");
      if (!this.state.characters[op.charId]) throw new RuleError("No such character.");
      // The character leaves its old seat; a player seat left with no characters is removed.
      for (const s of this.save.seats) {
        if (s === target || !charsOf(s).includes(op.charId)) continue;
        s.chars = charsOf(s).filter((id) => id !== op.charId);
        if (s.charId === op.charId) s.charId = s.chars[s.chars.length - 1] || null;
        if (s.role === "player" && !s.chars.length) s.removed = true;
      }
      target.chars = [...charsOf(target), op.charId];
      target.charId = op.charId;
      for (const c of this.clients) if (c.seat && c.seat.removed) { c.send({ type: "removed" }); c.close(); }
      this.persist();
      this.broadcast([{ type: "seatAssigned", seatId: target.id, charId: op.charId }]);
      return;
    }
    throw new RuleError("Unknown seat operation.");
  }

  persist() {
    this.store.write(this.save);
  }

  who(seat) {
    if (!seat) return { role: "table" };
    if (seat.role === "gm") return { role: "gm" };
    if (seat.charId) return { role: "player", charId: seat.charId };
    return { role: "table" };
  }

  roomInfo(seat) {
    const connected = new Set([...this.clients].filter((c) => c.seat).map((c) => c.seat.id));
    return {
      code: this.code, name: this.save.name, joinUrl: `${this.linkBase()}/j/${this.code}`,
      seats: this.save.seats.filter((s) => !s.removed).map((s) => ({ id: s.id, name: s.name, role: s.role, charId: s.charId, connected: connected.has(s.id) })),
      you: seat ? { seatId: seat.id, role: seat.role, charId: seat.charId, chars: charsOf(seat), name: seat.name } : { role: "table" },
    };
  }

  viewMessage(seat, events = []) {
    // The GM's card edits name cards from a deck or reserve: only the GM and that character's player hear of them.
    const secret = (e) => /^gm(CardMoved|CardAdded|DeckShuffled)$/.test(e.type);
    const mine = (e) => seat && (seat.role === "gm" || charsOf(seat).includes(e.id));
    return { type: "view", room: this.roomInfo(seat), view: viewFor(this.state, this.who(seat)), events: events.filter((e) => !secret(e) || mine(e)) };
  }

  broadcast(events = []) {
    for (const c of this.clients) c.send(this.viewMessage(c.seat, events));
  }
}
