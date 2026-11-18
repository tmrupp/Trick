// Shared browser code: the room connection, rendering that keeps what people are typing, card faces,
// readable event text, sounds and small helpers. Load /suit_icons.js and /card_rules.js before this module.

export const SUITS = {
  S: { key: "strength", name: "Strength", sym: "♥", status: "Injury", statusKey: "injury", consolation: "Brace", cls: "s" },
  D: { key: "dexterity", name: "Dexterity", sym: "♠", status: "Stumble", statusKey: "dazed", consolation: "Peek", cls: "d" },
  I: { key: "intelligence", name: "Intelligence", sym: "♦", status: "Stress", statusKey: "stress", consolation: "Recalculate", cls: "i" },
  W: { key: "weird", name: "Weird", sym: "♣", status: "Curse", statusKey: "curse", consolation: "Mirror", cls: "w" },
};

export const params = new URLSearchParams(location.search);

// ---- Connection ----

// Connect to a room and stay connected: rejoins with the saved token after any drop.
export function connect({ room, as, gmKey, getName, onView, onWelcome, onRejected, onStatus, onError }) {
  const key = `trick:${room}:${as}`;
  let ws = null;
  let seq = 0;
  let wait = 500;
  let stopped = false;
  const open = () => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    onStatus && onStatus("connecting");
    ws.onopen = () => {
      wait = 500;
      let token = null;
      try { token = localStorage.getItem(key); } catch {}
      ws.send(JSON.stringify({ type: "hello", room, as, token, gmKey, name: token ? undefined : getName && getName() }));
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "welcome") {
        try { if (msg.token) localStorage.setItem(key, msg.token); } catch {}
        onStatus && onStatus("connected");
        onWelcome && onWelcome(msg);
      } else if (msg.type === "view") onView(msg);
      else if (msg.type === "rejected") onRejected && onRejected(msg.reason, msg.seq);
      else if (msg.type === "removed") { stopped = true; try { localStorage.removeItem(key); } catch {} onError && onError("The GM removed your seat."); }
      else if (msg.type === "error") onError && onError(msg.reason);
    };
    ws.onclose = () => {
      onStatus && onStatus("offline");
      if (!stopped) setTimeout(open, (wait = Math.min(wait * 2, 8000)));
    };
  };
  open();
  return {
    act(action) { const s = ++seq; if (ws.readyState === 1) ws.send(JSON.stringify({ type: "action", seq: s, action })); else toast("Reconnecting… try again in a moment."); return s; },
    manage(op) { const s = ++seq; if (ws.readyState === 1) ws.send(JSON.stringify({ type: "manage", seq: s, ...op })); return s; },
    forget() { try { localStorage.removeItem(key); } catch {} },
  };
}

export const hasToken = (room, as) => { try { return !!localStorage.getItem(`trick:${room}:${as}`); } catch { return false; } };

// ---- DOM ----

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v; // trusted markup only (icons, catalog text)
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, "");
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
  return el;
}

// Redraw a region without losing what someone is typing: inputs with data-key keep their draft value
// and focus across redraws. Call forget(key) after sending a form.
const drafts = new Map();
export function render(root, nodes) {
  const active = document.activeElement;
  const focusKey = active && active.dataset ? active.dataset.key : null;
  let sel = null;
  try { sel = focusKey ? [active.selectionStart, active.selectionEnd] : null; } catch {}
  for (const el of root.querySelectorAll("[data-key]")) drafts.set(el.dataset.key, el.type === "checkbox" ? el.checked : el.value);
  root.replaceChildren(...[nodes].flat(Infinity).filter(Boolean));
  for (const el of root.querySelectorAll("[data-key]")) {
    if (!drafts.has(el.dataset.key)) continue;
    if (el.type === "checkbox") el.checked = drafts.get(el.dataset.key);
    else el.value = drafts.get(el.dataset.key);
  }
  if (focusKey) {
    const el = root.querySelector(`[data-key="${CSS.escape(focusKey)}"]`);
    if (el) { el.focus({ preventScroll: true }); try { if (sel) el.setSelectionRange(...sel); } catch {} }
  }
}
// The current value of a keyed field: what's on screen now, else the last draft.
export const draft = (key) => {
  const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (el) return el.type === "checkbox" ? el.checked : el.value;
  return drafts.get(key);
};
export const forget = (...keys) => keys.forEach((k) => drafts.delete(k));

export function toast(text, ms = 4000) {
  let box = document.querySelector(".toasts");
  if (!box) { box = h("div", { class: "toasts", "aria-live": "polite" }); document.body.append(box); }
  const t = h("div", { class: "toast" }, text);
  box.append(t);
  setTimeout(() => t.remove(), ms);
}

// ---- Cards ----

const valueLabel = (v) => (v === 1 ? "A" : String(v));

export function cardText(c) {
  const rules = globalThis.TrickCoreCards || {};
  if (!c) return "";
  if (c.blessed) return rules.blessed ? rules.blessed.description : "Always takes the trick it is played in.";
  const s = SUITS[c.suit];
  const entry = rules[c.status ? s.statusKey : s.key];
  return entry ? entry.description : "";
}

// The card's art file in exports/web (served at /cards/light and /cards/dark).
const STATUS_ART = { S: "injury", D: "dazed", I: "stress", W: "curse" };
export function artName(c) {
  if (c.blessed) return "blessed";
  if (c.status) return STATUS_ART[c.suit];
  return `${SUITS[c.suit].key}-${c.v}`;
}
const art = (name, alt) => h("picture", {},
  h("source", { media: "(prefers-color-scheme: dark)", srcset: `/cards/dark/${name}.png` }),
  h("img", { src: `/cards/light/${name}.png`, alt, loading: "lazy", decoding: "async", draggable: "false" }));

export function cardLabel(c) {
  if (!c) return "no card";
  if (c.blessed) return "Blessed";
  if (c.status) return `${SUITS[c.suit].status} (${SUITS[c.suit].name}, worth 0)`;
  return `${valueLabel(c.v)} of ${SUITS[c.suit].name}`;
}

// A card, drawn with its printed art. size: "sm" | "md" | "lg" | "xl". extra: { class, onclick, title, disabled }
export function cardFace(c, size = "md", extra = {}) {
  if (!c) return h("div", { class: `cf ${size} empty`, "aria-label": "no card" });
  const label = cardLabel(c);
  return h(extra.onclick ? "button" : "div", {
    class: `cf ${size} ${extra.class || ""}`,
    title: extra.title || `${label}. ${cardText(c)}`,
    onclick: extra.onclick, disabled: extra.disabled, type: extra.onclick ? "button" : undefined,
    "aria-label": extra.onclick ? label : undefined,
  },
  art(artName(c), label),
  c.beat != null ? h("span", { class: "beat" }, `counts ${c.beat}`) : null);
}

export const cardBack = (size = "md", extra = {}) => h("div", { class: `cf ${size} ${extra.class || ""}` }, art("back", "a face-down card"));

// The cards' typefaces, from Google Fonts, with serif fallbacks if they can't load.
if (!document.querySelector("link[data-fonts]")) {
  document.head.append(h("link", { rel: "stylesheet", "data-fonts": "", href: "https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Alegreya+SC:wght@700&family=Cormorant+Garamond:wght@700&family=Libre+Caslon+Text:wght@700&display=swap" }));
}

// ---- Text ----

export const RESULT = { critical: "Critical success", success: "Success", partial: "Partial success", failure: "Failure", bust: "Bust" };
export const RESULT_NOTE = {
  critical: "Exactly on target: you get it, and more.",
  success: "1–3 short: you get it, with a minor complication.",
  partial: "4–6 short: partly, with a serious complication.",
  failure: "7 or more short: it doesn't happen.",
  bust: "Over the target: it goes wrong, loudly.",
};

export function difficulty(kind, target) {
  if (!Number.isInteger(target)) return "";
  if (kind === "standard") return target < 6 ? "too low" : target <= 8 ? "easy" : target <= 11 ? "moderate" : target <= 14 ? "hard" : target <= 17 ? "very hard" : target <= 20 ? "extreme" : "beyond extreme";
  return target < 6 ? "too low" : target <= 8 ? "easy" : target <= 10 ? "moderate" : target <= 12 ? "hard" : "beyond hard";
}

// A sentence for a resolved trick, from the engine's log entry.
export function trickSentence(e, names) {
  const n = (id) => names[id] || id;
  const play = (id) => e.plays.find((p) => p.id === id);
  const bits = (p) => [p.brace ? `Brace +${p.brace}` : "", p.boost ? `${p.boost > 0 ? "+" : ""}${p.boost}` : ""].filter(Boolean).join(", ");
  if (e.winner) {
    const p = play(e.winner);
    const how = { blessed: "Blessed always takes it", highest: `the highest on-suit card${bits(p) ? ` (${bits(p)})` : ""}`, tieBreak: "a tie, settled by suit, then trump" }[e.reason];
    return `${n(e.winner)}'s ${p.label} takes the ${e.worldLabel}: ${how}. ${p.mirrored ? `Mirrored, it scores ${e.score}.` : `+${e.score}.`}`;
  }
  const why = {
    worldHighest: `no card beat it${e.worldBeat !== undefined ? ` (it counts ${e.worldBeat})` : ""}`,
    blocked: `${e.by ? `${n(e.by)}'s ${play(e.by).label}` : "an off-suit card"} is highest but off-suit, and blocks`,
    tieLevel: "a tie that stays level",
    blessedTie: "two Blessed tie",
  }[e.reason];
  return `The world keeps the ${e.worldLabel}: ${why}.`;
}

export function eventText(e, names, items = {}) {
  const n = (id) => names[id] || id;
  switch (e.type) {
    case "statusGained": return `${n(e.id)} gains ${e.status}${e.compulsion ? ` (compulsion: ${e.compulsion})` : ""}.`;
    case "statusUnavailable": return `${n(e.id)} has no ${e.status} left in reserve.`;
    case "survivalRequired": return `${n(e.id)} must survive: target ${e.target}.`;
    case "died": return `${n(e.id)} does not survive.`;
    case "blessedGranted": return `${n(e.id)} is granted a Blessed.`;
    case "blessedGiven": return `${n(e.from)} gives a Blessed to ${n(e.to)}.`;
    case "pricePaid": return `${n(e.id)} pays Stumble's Price.`;
    case "peekReplaced": return `Peek (${e.by.map(n).join(", ")}): the next world card, ${e.out}, is replaced by the ${e.in}.`;
    case "itemUsed": return `${n(e.id)} uses ${items[e.itemId] || e.itemId}${e.note ? `: ${e.note}` : ""}.`;
    case "itemGiven": return `${n(e.id)} gains ${items[e.itemId] || e.itemId}.`;
    case "curseViolated": return `${n(e.id)} breaks the compulsion and gains ${e.stress} Stress.`;
    case "rested": return `${n(e.id)} rests.`;
    case "evolved": return `${n(e.id)} evolves.`;
    case "reshuffled": return `${n(e.id)} reshuffles.`;
    case "boosted": return `${n(e.id)}'s next card counts ${e.amount > 0 ? "+" : ""}${e.amount}${e.reason ? ` (${e.reason})` : ""}.`;
    case "tallyAdjusted": return `${n(e.id)}'s tally ${e.delta > 0 ? "+" : ""}${e.delta}${e.reason ? ` (${e.reason})` : ""}.`;
    case "targetAdjusted": return `${n(e.id)}'s target is now ${e.target}${e.reason ? ` (${e.reason})` : ""}.`;
    case "worldValueSet": return `A world card now counts ${e.value} for beating${e.reason ? ` (${e.reason})` : ""}.`;
    default: return null;
  }
}

export function suitSelect(key, value, exclude = []) {
  return h("select", { "data-key": key }, Object.entries(SUITS).filter(([k]) => !exclude.includes(k)).map(([k, s]) => h("option", { value: k, selected: k === value }, `${s.sym} ${s.name}`)));
}

// ---- Catalogs (loaded as classic scripts on pages that need them) ----

export function itemsById() {
  const cat = globalThis.TrickItemCatalog ? globalThis.TrickItemCatalog.itemCatalog : [];
  return Object.fromEntries(cat.filter((i) => i.kind !== "reveal").map((i) => [i.id, i]));
}
export function racesById() {
  const cat = globalThis.TrickRaceCatalog ? globalThis.TrickRaceCatalog.raceCatalog : [];
  return Object.fromEntries(cat.filter((r) => r.id !== "shared-timing").map((r) => [r.id, r]));
}
export const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");

// ---- Sound and buzz ----

let soundOn = (() => { try { return localStorage.getItem("trick:sound") !== "off"; } catch { return true; } })();
let audio = null;
export function soundToggle() {
  const b = h("button", { class: "ghost small", "aria-pressed": String(soundOn), onclick: () => {
    soundOn = !soundOn;
    try { localStorage.setItem("trick:sound", soundOn ? "on" : "off"); } catch {}
    b.textContent = soundOn ? "Sound on" : "Sound off";
    b.setAttribute("aria-pressed", String(soundOn));
    if (soundOn) chime("ready");
  } }, soundOn ? "Sound on" : "Sound off");
  return b;
}
export function chime(kind) {
  if (!soundOn) return;
  try {
    audio = audio || new AudioContext();
    const notes = { reveal: [523, 659], ready: [440], win: [523, 659, 784], turn: [660, 660] }[kind] || [440];
    notes.forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = f; o.type = "triangle";
      g.gain.setValueAtTime(0.0001, audio.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + i * 0.12 + 0.25);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + i * 0.12); o.stop(audio.currentTime + i * 0.12 + 0.3);
    });
  } catch {}
}
export const buzz = (ms = 60) => { try { if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(ms); } catch {} };
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
