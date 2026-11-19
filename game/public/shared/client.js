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
export function connect({ room, as, gmKey, getName, reclaim, onView, onWelcome, onRejected, onStatus, onError }) {
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
      ws.send(JSON.stringify({ type: "hello", room, as, token, gmKey, name: token ? undefined : getName && getName(), reclaim: token ? undefined : reclaim }));
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
    stop() { stopped = true; try { ws.close(); } catch {} },
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

// ---- Tooltips ----
// Any element with data-tip shows a styled tip: on hover or keyboard focus, or on touch by pressing and holding.
let tipEl = null;
let tipFor = null;
let holdTimer = null;
function showTip(el) {
  const text = el && el.getAttribute("data-tip");
  if (!text) return;
  if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; tipEl.id = "tip"; tipEl.setAttribute("role", "tooltip"); document.body.append(tipEl); }
  tipEl.textContent = text;
  tipEl.hidden = false;
  tipFor = el;
  el.setAttribute("aria-describedby", "tip");
  const r = el.getBoundingClientRect();
  const t = tipEl.getBoundingClientRect();
  const below = r.top < t.height + 14;
  tipEl.classList.toggle("below", below);
  tipEl.style.left = `${Math.max(8, Math.min(innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2))}px`;
  tipEl.style.top = `${below ? r.bottom + 10 : r.top - t.height - 10}px`;
}
export function hideTip() {
  clearTimeout(holdTimer);
  if (tipEl) tipEl.hidden = true;
  if (tipFor) tipFor.removeAttribute("aria-describedby");
  tipFor = null;
}
if (typeof document !== "undefined") {
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (el && el !== tipFor) showTip(el); else if (!el && tipFor) hideTip();
  });
  // Keyboard focus shows a tip; a tap that focuses a button doesn't.
  document.addEventListener("focusin", (e) => { const el = e.target.closest && e.target.closest("[data-tip]"); if (el && e.target.matches(":focus-visible")) showTip(el); });
  document.addEventListener("focusout", hideTip);
  document.addEventListener("pointerdown", (e) => {
    hideTip();
    if (e.pointerType !== "touch") return;
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (el && !el.closest(".cf")) holdTimer = setTimeout(() => showTip(el), 450);
  });
  document.addEventListener("pointerup", (e) => { if (e.pointerType === "touch" && tipFor) setTimeout(hideTip, 2200); clearTimeout(holdTimer); });
  addEventListener("scroll", hideTip, true);
}

// ---- Menus ----
// menu(label, items) is a button that opens a menu. An item is one of:
//   { label, onclick, tip, hint, disabled, danger }      an action
//   { label, items: [...], tip }                          a submenu (opens to the side; inline on narrow screens)
//   { label, fields: [{ type, value, min, max, placeholder, name }], submit, onsubmit(values) }   a small form
//   { heading: "…" } and "-"                              a heading and a divider
// Menus live outside the page, so a redraw underneath doesn't close them.
const openPanels = [];
export function closeMenus(from = 0) {
  for (const p of openPanels.splice(from)) { p.panel.remove(); if (p.anchor) p.anchor.setAttribute("aria-expanded", "false"); }
}
function placePanel(panel, anchor, side) {
  const r = anchor.getBoundingClientRect();
  panel.style.visibility = "hidden";
  document.body.append(panel);
  const p = panel.getBoundingClientRect();
  let left = side ? r.right - 4 : r.left;
  let top = side ? r.top - 6 : r.bottom + 6;
  if (side && left + p.width > innerWidth - 8) left = r.left - p.width + 4;
  if (!side && left + p.width > innerWidth - 8) left = Math.max(8, r.right - p.width);
  if (top + p.height > innerHeight - 8) top = Math.max(8, side ? innerHeight - p.height - 8 : r.top - p.height - 6);
  panel.style.left = `${Math.max(8, left)}px`;
  panel.style.top = `${top}px`;
  panel.style.visibility = "";
}
const narrow = () => innerWidth < 600;
function menuItem(it, level) {
  if (it === "-") return h("div", { class: "menu-sep", role: "separator" });
  if (it.heading) return h("div", { class: "menu-head" }, it.heading);
  if (it.grid) return h("div", { class: "grid" }, it.grid.map((x) => menuItem(x, level)));
  if (it.fields) {
    const inputs = it.fields.map((f) => f.type === "select"
      ? h("select", { "aria-label": f.name || it.label }, f.options.map(([v, t]) => h("option", { value: v, selected: v === f.value }, t)))
      : h("input", { type: f.type || "text", value: f.value ?? "", min: f.min, max: f.max, placeholder: f.placeholder || "", "aria-label": f.placeholder || f.name || it.label, maxlength: f.type === "number" ? undefined : (f.maxlength || 80) }));
    const go = () => { const values = inputs.map((i) => (i.type === "number" ? Number(i.value) : i.value.trim())); closeMenus(); it.onsubmit(values); };
    for (const i of inputs) i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } e.stopPropagation(); });
    return h("div", { class: "menu-form", "data-tip": it.tip }, it.label ? h("div", { class: "menu-head" }, it.label) : null, h("div", { class: "row" }, inputs, h("button", { class: "small primary", onclick: go }, it.submit || "OK")));
  }
  const sub = !!it.items;
  const btn = h("button", { class: `menu-item${it.danger ? " danger" : ""}`, role: "menuitem", disabled: it.disabled, "data-tip": it.tip, "aria-haspopup": sub ? "menu" : undefined, "aria-expanded": sub ? "false" : undefined },
    h("span", { class: "menu-label" }, it.label), it.hint ? h("span", { class: "menu-hint" }, it.hint) : null, sub ? h("span", { class: "menu-arrow", "aria-hidden": "true" }, "›") : null);
  if (!sub) {
    btn.addEventListener("click", () => { closeMenus(); it.onclick && it.onclick(); });
    btn.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch" && !narrow()) closeMenus(level + 1); });
    return btn;
  }
  if (narrow()) {
    // Phones: the submenu opens inline, under its item.
    const box = h("div", { class: "menu-inline", hidden: true }, it.items.map((x) => menuItem(x, level)));
    btn.addEventListener("click", () => { box.hidden = !box.hidden; btn.setAttribute("aria-expanded", String(!box.hidden)); });
    return [btn, box];
  }
  const open = () => { if (openPanels[level + 1] && openPanels[level + 1].anchor === btn) return; closeMenus(level + 1); openPanel(btn, it.items, level + 1, true); };
  btn.addEventListener("click", open);
  btn.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") open(); });
  btn.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); open(); openPanels[level + 1] && openPanels[level + 1].panel.querySelector("button, input")?.focus(); } });
  return btn;
}
function openPanel(anchor, items, level, side) {
  const panel = h("div", { class: "menu", role: "menu" }, items.filter(Boolean).map((it) => menuItem(it, level)));
  panel.addEventListener("keydown", (e) => {
    const all = [...panel.querySelectorAll(":scope > .menu-item:not([disabled]), :scope > .menu-inline:not([hidden]) > .menu-item:not([disabled])")];
    const i = all.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (all[i + 1] || all[0])?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (all[i - 1] || all[all.length - 1])?.focus(); }
    else if (e.key === "ArrowLeft" && level > 0) { e.preventDefault(); closeMenus(level); anchor.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); closeMenus(); openPanels.length || (menuRoot && menuRoot.focus()); }
  });
  markSuits(panel);
  anchor.setAttribute("aria-expanded", "true");
  openPanels[level] = { panel, anchor };
  placePanel(panel, anchor, side);
  return panel;
}
let menuRoot = null;
export function menu(label, items, { class: cls = "", tip, onopen } = {}) {
  const btn = h("button", { class: `menu-button ${cls}`, "aria-haspopup": "menu", "aria-expanded": "false", "data-tip": tip },
    label, h("span", { class: "menu-caret", "aria-hidden": "true" }, "▾"));
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasOpen = openPanels[0] && openPanels[0].anchor === btn;
    closeMenus();
    if (wasOpen) return;
    hideTip();
    onopen && onopen();
    menuRoot = btn;
    const list = typeof items === "function" ? items() : items;
    openPanel(btn, list, 0, false).querySelector("button:not([disabled]), input")?.focus({ preventScroll: true });
  });
  return btn;
}
// Open a menu at any element, e.g. a card that was tapped.
export function openMenuAt(anchor, items) {
  closeMenus(); hideTip(); menuRoot = anchor;
  openPanel(anchor, items, 0, false).querySelector("button:not([disabled]), input")?.focus({ preventScroll: true });
}
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", (e) => { if (openPanels.length && !e.target.closest(".menu, .menu-button")) closeMenus(); });
  addEventListener("resize", () => closeMenus());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openPanels.length) closeMenus(); });
}

// ---- Suit marks in text ----
// Trick logs and labels carry ♥♠♦♣; on screen they become the cards' own marks (flag, boot, book, moon) in suit ink.
const SUIT_OF = { "♥": "strength", "♠": "dexterity", "♦": "intelligence", "♣": "weird" };
const SUIT_NAME = { strength: "Strength", dexterity: "Dexterity", intelligence: "Intelligence", weird: "Weird" };
export function markSuits(root) {
  const icons = globalThis.TrickSuitIcons;
  if (!root || !icons || typeof document === "undefined") return root;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (/[♥♠♦♣]/.test(n.data) && n.parentElement && !n.parentElement.closest("select, option, textarea, input, .mark, svg") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const found = [];
  while (walker.nextNode()) found.push(walker.currentNode);
  for (const n of found) {
    const frag = document.createDocumentFragment();
    for (const part of n.data.split(/([♥♠♦♣])/)) {
      if (!part) continue;
      const k = SUIT_OF[part];
      if (!k) { frag.append(part); continue; }
      const sp = document.createElement("span");
      sp.className = `mark k-${k}`;
      sp.setAttribute("role", "img");
      sp.setAttribute("aria-label", SUIT_NAME[k]);
      sp.innerHTML = icons.svg(k);
      frag.append(sp);
    }
    n.replaceWith(frag);
  }
  return root;
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
  if (tipFor && !tipFor.isConnected) hideTip();
  markSuits(root);
}
// The current value of a keyed field: what's on screen now, else the last draft.
export const draft = (key) => {
  const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (el) return el.type === "checkbox" ? el.checked : el.value;
  return drafts.get(key);
};
export const forget = (...keys) => keys.forEach((k) => drafts.delete(k));

// Toasts sit at the top, two at most; decisions never go in a toast. Several lines can be merged into one.
export function toast(text, ms = 4000) {
  if (Array.isArray(text)) text = text.filter(Boolean).join(" · ");
  if (!text) return;
  let box = document.querySelector(".toasts");
  if (!box) { box = h("div", { class: "toasts", "aria-live": "polite" }); document.body.append(box); }
  for (const old of box.children) if (old.textContent === text) old.remove();
  const t = h("div", { class: "toast", onclick: () => t.remove() }, text);
  markSuits(t);
  box.append(t);
  while (box.children.length > 2) box.firstChild.remove();
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

// A simple face, easy to read at any size: the value, the suit mark, and what the card does when it loses.
function simpleFace(c) {
  const key = c.blessed ? "blessed" : SUITS[c.suit].key;
  const icons = globalThis.TrickSuitIcons;
  return [
    h("span", { class: "sv" }, c.blessed ? "" : c.status ? "0" : valueLabel(c.v)),
    h("span", { class: "si", html: icons ? icons.svg(key) : "" }),
    h("span", { class: "sbig", html: icons ? icons.svg(key) : "" }),
    h("span", { class: "sn" }, c.blessed ? "Blessed" : c.status ? SUITS[c.suit].status : SUITS[c.suit].consolation),
  ];
}

// A card. size: "sm" | "md" | "lg" | "xl" | "stage". The screens draw simple faces; extra.art draws the printed card.
// extra: { class, onclick, title, disabled, badge, art }. Press and hold any card to see the printed card full size.
export function cardFace(c, size = "md", extra = {}) {
  if (!c) return h("div", { class: `cf ${size} empty`, "aria-label": "no card" });
  const label = cardLabel(c);
  const kind = c.blessed ? "blessed" : SUITS[c.suit].key;
  const el = h(extra.onclick ? "button" : "div", {
    class: `cf ${size} ${extra.art ? "" : `simple k-${kind}${c.status ? " is-status" : ""}${c.blessed ? " is-blessed" : ""}`} ${extra.class || ""}`,
    "data-tip": extra.title || `${label}. ${cardText(c)}`,
    onclick: extra.onclick, "aria-disabled": extra.disabled ? "true" : undefined, type: extra.onclick ? "button" : undefined,
    "aria-label": extra.onclick ? label : undefined,
  },
  extra.art ? art(artName(c), label) : simpleFace(c),
  c.beat != null ? h("span", { class: "beat" }, `counts ${c.beat}`) : extra.badge ? h("span", { class: "beat badge" }, extra.badge) : null);
  if (!extra.onclick) el.setAttribute("aria-label", label), el.setAttribute("role", "img");
  el._card = c;
  if (extra.disabled && extra.onclick) el.addEventListener("click", (e) => e.stopImmediatePropagation(), { capture: true });
  return el;
}

// The card, full size, with its rule in large type. Tap anywhere to close.
export function zoomCard(c) {
  if (!c) return;
  hideTip();
  const close = () => box.remove();
  const box = h("div", { class: "zoom", role: "dialog", "aria-label": cardLabel(c), onclick: close },
    h("div", { class: "zoom-inner" }, h("div", { class: "cf zoomed" }, art(artName(c), cardLabel(c))),
      h("div", { class: "zoom-text" }, h("h2", {}, cardLabel(c)), h("p", {}, cardText(c)), c.beat != null ? h("p", { class: "pill" }, `Counts ${c.beat} for beating`) : null,
        h("p", { class: "small muted" }, "Tap anywhere to close."))));
  document.querySelectorAll(".zoom").forEach((z) => z.remove());
  document.body.append(box);
  const onKey = (e) => { if (e.key === "Escape") { close(); removeEventListener("keydown", onKey); } };
  addEventListener("keydown", onKey);
}
if (typeof document !== "undefined") {
  // Press and hold a card (touch) or double-click it (mouse) to zoom.
  let hold = null, held = false;
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest && e.target.closest(".cf");
    if (!el || !el._card) return;
    held = false;
    hold = setTimeout(() => { held = true; zoomCard(el._card); }, 480);
  }, true);
  for (const t of ["pointerup", "pointercancel", "pointerleave"]) document.addEventListener(t, () => clearTimeout(hold), true);
  document.addEventListener("click", (e) => { if (held) { held = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener("dblclick", (e) => { const el = e.target.closest && e.target.closest(".cf"); if (el && el._card) zoomCard(el._card); });
  document.addEventListener("contextmenu", (e) => { if (e.target.closest && e.target.closest(".cf")) e.preventDefault(); });
}

// Who we're waiting on: initials that pulse while someone is choosing and settle once they've locked.
export function waitingFaces(people) {
  return h("div", { class: "faces", role: "list" }, people.map(({ name, done, me }) =>
    h("span", { class: `face${done ? " done" : ""}${me ? " me" : ""}`, role: "listitem", "data-tip": `${name}: ${done ? "locked in" : "choosing"}` },
      h("span", { class: "face-dot", "aria-hidden": "true" }, (name || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()),
      h("span", { class: "face-name" }, me ? "You" : name))));
}

export const cardBack = (size = "md", extra = {}) => h("div", { class: `cf ${size} back ${extra.class || ""}`, role: "img", "aria-label": "a face-down card" });

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

// Difficulty bands a player can suggest: [name, low, high, the target it suggests].
export function difficultyBands(kind) {
  return kind === "standard"
    ? [["Easy", 6, 8, 7], ["Moderate", 9, 11, 10], ["Hard", 12, 14, 13], ["Very hard", 15, 17, 16], ["Extreme", 18, 20, 19]]
    : [["Easy", 6, 8, 7], ["Moderate", 9, 10, 9], ["Hard", 11, 12, 11]];
}

// A one-line hint for a target a player is thinking of: its difficulty, its band, and for standard checks
// the simulated odds from RULES.md.
const STANDARD_ODDS = { Easy: "exact hit 17–24%, bust 13–19%", Moderate: "exact hit 10–22%, bust 10–16%", Hard: "exact hit 7–15%, bust 7–11%", "Very hard": "exact hit 4–11%, bust 4–7%", Extreme: "exact hit 2–7%, bust 2–5%" };
export function difficultyHint(kind, target) {
  if (!Number.isInteger(target) || target < 1) return "Enter a whole number.";
  const bands = difficultyBands(kind);
  const [lo, hi] = [bands[0][1], bands[bands.length - 1][2]];
  if (target < lo) return `Too low: below ${lo}, busts rise without making success likelier.`;
  if (target > hi) return `Beyond ${bands[bands.length - 1][0].toLowerCase()}: ${kind} checks run ${lo}–${hi}.`;
  const [name, blo, bhi] = bands.find(([, a, b]) => target >= a && target <= b);
  return `${name} (${blo}–${bhi})${kind === "standard" ? `: ${STANDARD_ODDS[name]}` : ""}.`;
}

export function difficulty(kind, target) {
  if (!Number.isInteger(target)) return "";
  if (kind === "standard") return target < 6 ? "too low" : target <= 8 ? "easy" : target <= 11 ? "moderate" : target <= 14 ? "hard" : target <= 17 ? "very hard" : target <= 20 ? "extreme" : "beyond extreme";
  return target < 6 ? "too low" : target <= 8 ? "easy" : target <= 10 ? "moderate" : target <= 12 ? "hard" : "beyond hard";
}

// A sentence for a resolved trick, from the engine's log entry.
export function trickSentence(e, names) {
  const n = (id) => names[id] || id;
  const play = (id) => e.plays.find((p) => p.id === id);
  const bits = (p) => [p.mirrored ? `Mirrored, it counts ${p.bv}` : "", p.brace ? `Brace +${p.brace}` : "", p.boost ? `${p.boost > 0 ? "+" : ""}${p.boost}` : ""].filter(Boolean).join(", ");
  if (e.winner) {
    const p = play(e.winner);
    const how = { blessed: "Blessed always takes it", highest: `the highest on-suit card${bits(p) ? ` (${bits(p)})` : ""}`, tieBreak: "a tie, settled by suit, then trump" }[e.reason];
    return `${n(e.winner)}'s ${p.label} takes the ${e.worldLabel}: ${how}. +${e.score}.`;
  }
  const why = {
    worldHighest: `no card beat it${e.worldBeat !== undefined ? ` (it counts ${e.worldBeat})` : ""}`,
    blocked: `${e.by ? `${n(e.by)}'s ${play(e.by).label}` : "an off-suit card"} is highest but off-suit, and blocks`,
    tieLevel: "a tie that stays level",
    blessedTie: "two Blessed tie",
  }[e.reason];
  return `The world keeps the ${e.worldLabel}: ${why}.`;
}

const PLACE_NAMES = { "deck-top": "the top of their deck", "deck-bottom": "the bottom of their deck", "deck-shuffle": "shuffled into their deck", discard: "their discard", hand: "their hand", reserve: "reserve" };

export function eventText(e, names, items = {}) {
  const n = (id) => names[id] || id;
  switch (e.type) {
    case "statusGained": return `${n(e.id)} gains ${e.status}${e.compulsion ? ` (compulsion: ${e.compulsion})` : ""}.`;
    case "statusUnavailable": return `${n(e.id)} has no ${e.status} left in reserve.`;
    case "survivalRequired": return `${n(e.id)} must survive: target ${e.target}.`;
    case "died": return `${n(e.id)} does not survive.`;
    case "resurrected": return `${n(e.id)} is back.`;
    case "retired": return `${n(e.id)} retires.`;
    case "renamed": return `${e.from} is now ${e.to}.`;
    case "unretired": return `${n(e.id)} comes out of retirement.`;
    case "checkCancelled": return "The GM cancels the check. Everyone is back where they were.";
    case "gmCardMoved": return `GM: ${n(e.id)}'s ${e.card} moves from ${e.from} to ${PLACE_NAMES[e.to] || e.to}.`;
    case "gmCardAdded": return `GM: ${n(e.id)} gains ${/^[AEIOU]/.test(e.card) ? "an" : "a"} ${e.card} (${PLACE_NAMES[e.to] || e.to})${e.extra ? ", an extra card" : ""}.`;
    case "gmDeckShuffled": return `GM: ${n(e.id)}'s deck is shuffled.`;
    case "characterCreated": return `${e.name} joins the campaign.`;
    case "blessedGranted": return `${n(e.id)} is granted a Blessed.`;
    case "blessedGiven": return `${n(e.from)} gives a Blessed to ${n(e.to)}.`;
    case "pricePaid": return `${n(e.id)} pays Stumble's Price.`;
    case "peekReplaced": return `Peek: the next world card, ${e.out}, is replaced by the ${e.in}.`;
    case "peekKept": return `Peek: the ${e.world} stays.`;
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
export const isSoundOn = () => soundOn;
export function setSoundOn(on) {
  soundOn = !!on;
  try { localStorage.setItem("trick:sound", soundOn ? "on" : "off"); } catch {}
  if (soundOn) chime("ready");
}
// Played cards arrive in trick logs as labels ("7♥", "A♣", "Injury", "Blessed"); rebuild enough to draw the card.
export function cardFromLabel(label) {
  if (!label) return null;
  if (label === "Blessed") return { blessed: true, v: 0, label };
  const st = Object.entries(SUITS).find(([, x]) => x.status === label);
  if (st) return { suit: st[0], status: true, v: 0, label };
  const suit = Object.entries(SUITS).find(([, x]) => x.sym === label.slice(-1));
  if (!suit) return null;
  const v = label.slice(0, -1) === "A" ? 1 : Number(label.slice(0, -1));
  return { suit: suit[0], v, label };
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
