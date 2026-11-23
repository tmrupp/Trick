// A room: one loaded campaign, its seats, and the sockets watching it.
import { apply, replay, viewFor, RuleError } from "../engine/index.mjs";
import { nextBotAction } from "../engine/bot.mjs";
import { newSecret } from "./store.mjs";
import { charsOf, playedCharacters, returningSeats, playCharacter, assignCharacter, nextSeatId } from "./seats.mjs";

export { charsOf };

const MAX_SEATS = 10;

// What a player seat may do: act for its own character only. The GM may do anything.
// Every action carries the time it happened, for the campaign history. The rules never read it.
const stamp = (a) => ({ ...a, at: Date.now() });
const PLAYER_ACTIONS = new Set(["createCharacter", "declareApproach", "lockCard", "unlockCard", "recalculate", "peek", "giveBlessed", "evolve", "evolvePick", "useItem", "resolvePeekDeck", "resolvePeekWorld"]);

export function authorize(seat, action) {
  if (seat.role === "gm") return;
  if (!PLAYER_ACTIONS.has(action.type)) throw new RuleError("Only the GM can do that.");
  if (action.type === "createCharacter") return; // the room checks the seat isn't mid-check
  if (!seat.charId) throw new RuleError("Create your character first.");
  if (action.charId !== seat.charId) throw new RuleError("You can only act for your own character.");
  if (action.force) throw new RuleError("Only the GM can do that."); // e.g. undoing a random lock
}


const SUIT_ORDER = ["S", "D", "I", "W"];

// Notes are plain text kept with the campaign: shared (everyone edits), the GM's own, and each player's own.
const NOTES_MAX = 20000;
const cleanText = (t) => String(t ?? "").replace(/\r\n?/g, "\n").slice(0, NOTES_MAX);

// The plain text of a Google Doc shared as "Anyone with the link", from Google's text export. No sign-in needed.
async function fetchDocText(url) {
  const m = String(url || "").match(/^https:\/\/docs\.google\.com\/document\/d\/([A-Za-z0-9_-]{20,})/);
  if (!m) throw new RuleError("Paste a Google Docs link (https://docs.google.com/document/d/…).");
  let res;
  try { res = await fetch(`https://docs.google.com/document/d/${m[1]}/export?format=txt`, { redirect: "follow" }); }
  catch { throw new RuleError("Couldn't reach Google Docs from the host."); }
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !/text\/plain/.test(type)) throw new RuleError("Couldn't read that doc. In Google Docs, set Share → General access → Anyone with the link.");
  return (await res.text()).replace(/^\uFEFF/, "");
}
const BOT_KINDS = { greedy: "Greedy", ltr: "Lantern" };

export class Room {
  constructor(save, store, linkBase = () => "", { botDelay = 650, itemPrices = {} } = {}) {
    this.botDelay = botDelay;
    this.itemPrices = itemPrices; // Relic Price text by item id: hidden information, sent only through viewFor
    this.botTimer = null;
    this.save = save;
    this.store = store;
    this.linkBase = linkBase;
    // A save keeps the game's state, so later rule changes never rewrite past checks. Older saves without it replay.
    if (save.state && save.state.actions && save.state.actions.length === save.actions.length) this.state = save.state;
    else try {
      // The rules a save was played under: recorded on it, else in its state; a save with neither predates automatic
      // consolations, so it replays under the older rules (legacy.mjs).
      const rules = save.rules || (save.state && save.state.rules) || { peek: "choose" };
      this.state = replay({ seed: save.seed, gmSeat: save.gmSeat, rules }, save.actions);
    } catch (e) {
      // Saves from while Peek happened automatically won't replay with the Peek choice: keep them on that rule.
      if (save.rules) throw e;
      this.state = replay({ seed: save.seed, gmSeat: save.gmSeat, rules: { peek: "auto" } }, save.actions);
      save.rules = { peek: "auto" };
    }
    this.clients = new Set(); // { ws, seat | null, as }
    this.scheduleBots();
  }

  // Bots act one step at a time, a moment after each change, so the table sees them think and lock in.
  scheduleBots() {
    clearTimeout(this.botTimer);
    this.botTimer = setTimeout(() => this.runBot(), this.botDelay);
    if (this.botTimer.unref) this.botTimer.unref();
  }

  runBot() {
    const action = nextBotAction(this.state);
    if (!action) return;
    try {
      const { state, events } = apply(this.state, stamp(action));
      this.state = state;
      this.save.actions = state.actions;
      this.persist();
      this.broadcast(events);
    } catch (e) {
      console.error("bot action failed:", action.type, e.message);
      return;
    }
    this.scheduleBots();
  }

  stop() { clearTimeout(this.botTimer); }

  get code() { return this.save.code; }

  seatById(id) { return this.save.seats.find((s) => s.id === id); }

  // Player seats with a character and no phone connected: someone returning on a new browser or link can take one back.
  returning() {
    return returningSeats(this.save, this.state, new Set([...this.clients].filter((c) => c.seat).map((c) => c.seat.id)));
  }

  // Join or rejoin. Returns the seat (null for a table screen).
  join({ as, token, name, gmKey, reclaim, claimIfFree }) {
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
      // A browser's remembered seat, from a new tab: only if no other tab has it open.
      if (seat && !seat.removed && claimIfFree && [...this.clients].some((c) => c.seat === seat)) throw new RuleError("That seat is open in another tab.");
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
    const id = nextSeatId(this.save, "player"); // removed seats keep their numbers
    const seat = { id, token: newSecret(), name: clean, role: "player", charId: null };
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
    if (a.type === "beginCheck") {
      // Only characters someone is playing right now can take part.
      const played = playedCharacters(this.save);
      for (const id of a.participants || []) {
        const c = this.state.characters[id];
        if (c && !played.has(id)) throw new RuleError(`${c.name} isn't being played by anyone right now.`);
      }
    }
    if (a.type === "createCharacter") {
      if (seat.charId && this.inCheck(seat.charId)) throw new RuleError("Finish this check before making a new character.");
      // The server names the character after its seat (p1, then p1-2, p1-3…), so ids never collide.
      const base = seat.role === "gm" ? "gm" : seat.id;
      let id = base;
      for (let n = 2; this.state.characters[id]; n++) id = `${base}-${n}`;
      a = { type: "createCharacter", id, name: String(a.name || seat.name).slice(0, 24), primary: a.primary, secondary: a.secondary, others: a.others, race: a.race || null, controller: seat.role };
    }
    const { state, events } = apply(this.state, stamp(a));
    this.state = state;
    this.save.actions = state.actions;
    if (a.type === "createCharacter") playCharacter(seat, a.id);
    if (a.type === "renameCharacter") for (const s of this.save.seats) if (s.role === "bot" && s.charId === a.charId) s.name = state.characters[a.charId].name;
    this.save.characterNames = Object.values(state.characters).map((c) => c.name);
    this.persist();
    this.broadcast(events);
    this.scheduleBots();
    return events;
  }

  // ---- Notes ----
  notesOf(seat, scope) {
    const note = scope === "mine" ? seat && seat.notes : this.save.notes && this.save.notes[scope];
    return note && typeof note === "object" ? note : { text: "" }; // older saves held Google Docs links here
  }

  // What a screen may see: shared for everyone, the GM's for the GM, a player's own for that seat alone.
  notesFor(seat) {
    const out = { shared: this.notesOf(null, "shared") };
    if (seat && seat.role === "gm") out.gm = this.notesOf(seat, "gm");
    if (seat && seat.role === "player") out.mine = this.notesOf(seat, "mine");
    return out;
  }

  setNotes(seat, scope, text) {
    const note = { text, by: seat.name, at: Date.now() };
    if (scope === "mine") seat.notes = note;
    else this.save.notes = { shared: this.notesOf(null, "shared"), gm: this.notesOf(null, "gm"), [scope]: note };
    this.persist();
    // Only the screens that may see these notes hear about the change.
    for (const c of this.clients) {
      const sees = scope === "shared" || (scope === "gm" && c.seat && c.seat.role === "gm") || (scope === "mine" && c.seat === seat);
      if (sees) c.send({ type: "notes", notes: { [scope]: note } });
    }
  }

  inCheck(charId) {
    const ck = this.state.check;
    return !!(ck && ck.phase !== "closed" && ck.players[charId]);
  }

  // Seat management, outside the engine. Any seat may switch between its own characters; the rest is the GM's.
  manage(seat, op) {
    // Notes: shared (players and the GM edit), the GM's own, and a player's own.
    if (seat && (op.op === "editNotes" || op.op === "importNotes")) {
      const scope = op.scope;
      if (scope === "gm" && seat.role !== "gm") throw new RuleError("Only the GM keeps GM notes.");
      if (scope === "mine" && seat.role !== "player") throw new RuleError("Only a player keeps personal notes.");
      if (!["shared", "gm", "mine"].includes(scope)) throw new RuleError("Notes are shared, the GM's, or your own.");
      if (op.op === "editNotes") return this.setNotes(seat, scope, cleanText(op.text));
      // Import: a Google Doc's text, added to the end of these notes.
      return fetchDocText(op.url).then((text) => {
        const current = this.notesOf(seat, scope).text;
        this.setNotes(seat, scope, cleanText(current ? `${current}\n\n${text}` : text));
      });
    }
    if (seat && op.op === "switch") {
      if (!charsOf(seat).includes(op.charId) || !this.state.characters[op.charId]) throw new RuleError("That isn't one of your characters.");
      if (seat.charId && seat.charId !== op.charId && this.inCheck(seat.charId)) throw new RuleError("Finish this check before switching characters.");
      playCharacter(seat, op.charId);
      this.persist();
      this.broadcast([{ type: "seatSwitched", seatId: seat.id, charId: op.charId }]);
      return;
    }
    if (!seat || seat.role !== "gm") throw new RuleError("Only the GM can manage seats.");
    if (op.op === "addBot") {
      const kind = op.kind === "ltr" ? "ltr" : "greedy";
      const primary = SUIT_ORDER.includes(op.primary) ? op.primary : "S";
      const rest = SUIT_ORDER.filter((s) => s !== primary);
      const id = nextSeatId(this.save, "bot");
      const name = String(op.name || `${BOT_KINDS[kind]} ${id.slice(1)}`).trim().slice(0, 24);
      const { state, events } = apply(this.state, stamp({ type: "createCharacter", id, name, primary, secondary: rest[0], others: [rest[1], rest[2]], controller: "bot", bot: kind }));
      this.state = state;
      this.save.actions = state.actions;
      const botSeat = { id, token: newSecret(), name, role: "bot", charId: null };
      playCharacter(botSeat, id);
      this.save.seats.push(botSeat);
      this.save.characterNames = Object.values(state.characters).map((c) => c.name);
      this.persist();
      this.broadcast(events);
      this.scheduleBots();
      return;
    }
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
      const removed = assignCharacter(this.save, target, op.charId);
      for (const c of this.clients) if (removed.includes(c.seat)) { c.send({ type: "removed" }); c.close(); }
      this.persist();
      this.broadcast([{ type: "seatAssigned", seatId: target.id, charId: op.charId }]);
      return;
    }
    throw new RuleError("Unknown seat operation.");
  }

  persist() {
    this.save.state = this.state;
    this.store.write(this.save);
  }

  who(seat) {
    if (!seat) return { role: "table" };
    if (seat.role === "gm") return { role: "gm" };
    if (seat.charId) return { role: "player", charId: seat.charId, charIds: charsOf(seat) };
    return { role: "table" };
  }

  roomInfo(seat) {
    const connected = new Set([...this.clients].filter((c) => c.seat).map((c) => c.seat.id));
    return {
      code: this.code, name: this.save.name, joinUrl: `${this.linkBase()}/j/${this.code}`,
      seats: this.save.seats.filter((s) => !s.removed).map((s) => ({ id: s.id, name: s.name, role: s.role, charId: s.charId, chars: charsOf(s), connected: connected.has(s.id) })),
      you: seat ? { seatId: seat.id, role: seat.role, charId: seat.charId, chars: charsOf(seat), name: seat.name } : { role: "table" },
    };
  }

  viewMessage(seat, events = []) {
    // The GM's card edits name cards from a deck or reserve: only the GM and that character's player hear of them.
    const secret = (e) => /^(gm(CardMoved|CardAdded|DeckShuffled)|cardTucked|cardUntucked)$/.test(e.type);
    const mine = (e) => seat && (seat.role === "gm" || charsOf(seat).includes(e.id));
    return { type: "view", room: this.roomInfo(seat), view: viewFor(this.state, this.who(seat), { itemPrices: this.itemPrices }), events: events.filter((e) => !secret(e) || mine(e)) };
  }

  broadcast(events = []) {
    for (const c of this.clients) c.send(this.viewMessage(c.seat, events));
  }
}
