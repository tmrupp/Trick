// Shared browser code: the room connection, rendering that keeps what people are typing, card faces,
// readable event text, sounds and small helpers. Load /suit_icons.js and /card_rules.js before this module.

import { SUIT_INFO, countsAs, STATUSES_PER_SUIT, BLESSED_PER_PLAYER } from "/engine/cards.mjs";
import { DIFFICULTY, CHECK_KINDS, difficulty as difficultyWord } from "/engine/rules.mjs";

// The suits come from the engine; the pages add only what they need to draw them (art and rule-text keys).
const SUIT_UI = { S: { key: "strength", statusKey: "injury" }, D: { key: "dexterity", statusKey: "dazed" }, I: { key: "intelligence", statusKey: "stress" }, W: { key: "weird", statusKey: "curse" } };
export const SUITS = Object.fromEntries(Object.entries(SUIT_INFO).map(([k, x]) => [k, { ...SUIT_UI[k], name: x.name, sym: x.symbol, status: x.status, consolation: x.consolation, cls: k.toLowerCase() }]));

export const params = new URLSearchParams(location.search);

// ---- Connection ----

// Seat tokens: each browser tab keeps its own (sessionStorage), so two tabs can play two characters. The newest
// token is also remembered for the browser (localStorage), so a tab opened later finds its seat again, unless
// that seat is already open in another tab, when the host says so and the tab joins as someone else.
const tabStore = { get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} }, del: (k) => { try { sessionStorage.removeItem(k); } catch {} } };
const browserStore = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }, del: (k) => { try { localStorage.removeItem(k); } catch {} } };

// Connect to a room and stay connected: rejoins with this tab's seat token after any drop.
// fresh: join as someone new (or reclaim), ignoring the seat this browser last used.
// onClosed: the host closed the campaign; the connection stops trying (see closedNotice).
export function connect({ room, as, gmKey, getName, reclaim, fresh = false, allowShared = false, onView, onWelcome, onRejected, onStatus, onError, onNotes, onClosed }) {
  const key = `trick:${room}:${as}`;
  let ws = null;
  let seq = 0;
  let wait = 500;
  let stopped = false;
  let mine = null; // the token this tab holds
  const open = () => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    onStatus && onStatus("connecting");
    ws.onopen = () => {
      wait = 500;
      const tab = mine || tabStore.get(key);
      const shared = !tab && !fresh ? browserStore.get(key) : null;
      const token = tab || shared;
      ws.send(JSON.stringify({ type: "hello", room, as, token, claimIfFree: !!shared && !allowShared, gmKey, name: token ? undefined : getName && getName(), reclaim: token ? undefined : reclaim }));
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "welcome") {
        if (msg.token) { mine = msg.token; tabStore.set(key, msg.token); browserStore.set(key, msg.token); }
        onStatus && onStatus("connected");
        onWelcome && onWelcome(msg);
      } else if (msg.type === "view") onView(msg);
      else if (msg.type === "notes") onNotes && onNotes(msg.notes, !!msg.all);
      else if (msg.type === "rejected") onRejected && onRejected(msg.reason, msg.seq);
      else if (msg.type === "removed") { stopped = true; forget(); onError && onError("The GM removed your seat."); }
      else if (msg.type === "closed") { stopped = true; (onClosed || onError || (() => {}))(msg.reason); }
      else if (msg.type === "error") onError && onError(msg.reason);
    };
    ws.onclose = () => {
      onStatus && onStatus(stopped ? "stopped" : "offline");
      if (!stopped) setTimeout(open, (wait = Math.min(wait * 2, 8000)));
    };
  };
  // Forget this tab's seat; the browser's memory too, if it points at the same seat.
  const forget = () => {
    const t = mine || tabStore.get(key);
    tabStore.del(key);
    if (t && browserStore.get(key) === t) browserStore.del(key);
    mine = null;
  };
  open();
  return {
    act(action) { const s = ++seq; if (ws.readyState === 1) ws.send(JSON.stringify({ type: "action", seq: s, action })); else toast("Reconnecting… try again in a moment."); return s; },
    manage(op) { const s = ++seq; if (ws.readyState === 1) ws.send(JSON.stringify({ type: "manage", seq: s, ...op })); return s; },
    forget,
    stop() { stopped = true; try { ws.close(); } catch {} },
  };
}

// What a screen shows once the host has closed its campaign: it stops, says so, and can try again once it's open.
export function closedNotice(main, reason) {
  main.replaceChildren(h("div", { class: "panel banner bad" },
    h("h2", {}, "Campaign closed"), h("p", {}, reason),
    h("button", { class: "mt", onclick: () => location.reload() }, "Try again")));
}

export const hasToken = (room, as) => !!(tabStore.get(`trick:${room}:${as}`) || browserStore.get(`trick:${room}:${as}`));

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
    btn.addEventListener("click", () => {
      if (it.confirm && !btn.classList.contains("danger-armed")) {
        btn.classList.add("danger-armed");
        btn.querySelector(".menu-label").textContent = it.confirm;
        return;
      }
      closeMenus(); it.onclick && it.onclick();
    });
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

// The world's consolation for a world card of this suit, as RULES.md words it (via card_rules.js): { name, description }.
const worldConsolation = (c) => (c && c.suit && !c.status && !c.blessed && SUITS[c.suit] && (globalThis.TrickWorldConsolations || {})[SUITS[c.suit].key]) || null;
export function worldCardText(c) {
  const wc = worldConsolation(c);
  return wc ? `World card. If a player takes it, the world's consolation is ${wc.name}: ${wc.description}` : cardText(c);
}

// A consolation's rule, as RULES.md words it (via card_rules.js): consolationText("S") is Brace's.
export const consolationText = (suit) => `${SUITS[suit].consolation}: ${cardText({ suit, v: 1 })}`;

// What waits on a participant's next card from the last trick they lost: Brace, Shave and Mirror, as suit-toned pills.
export const consolationPills = (p) => [
  p.brace ? h("span", { class: `pill tinted ${tone("S")}`, "data-tip": consolationText("S") }, `Brace +${p.brace}`) : null,
  p.shave ? h("span", { class: `pill tinted ${tone("D")}`, "data-tip": consolationText("D") }, `Shave −${p.shave}`) : null,
  p.mirror ? h("span", { class: `pill tinted ${tone("W")}`, "data-tip": consolationText("W") }, "Mirror") : null,
];

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
// World cards show the world's consolation name (e.g. Peek on Intelligence instead of Recalculate).
function simpleFace(c, world = false) {
  const key = c.blessed ? "blessed" : SUITS[c.suit].key;
  const icons = globalThis.TrickSuitIcons;
  const foot = c.blessed ? "Blessed" : c.status ? SUITS[c.suit].status : world && worldConsolation(c) ? worldConsolation(c).name : SUITS[c.suit].consolation;
  return [
    h("span", { class: "sv" }, c.blessed ? "" : c.status ? "0" : valueLabel(c.v)),
    h("span", { class: "si", html: icons ? icons.svg(key) : "" }),
    h("span", { class: "sbig", html: icons ? icons.svg(key) : "" }),
    h("span", { class: "sn" }, foot),
  ];
}

// What a world card's world consolation or a GM adjustment has changed: "counts 14 to beat", "scores 1 less", or both.
// The stage on every screen shows it under the current world card; cardFace puts the short form in the card's corner.
export function worldNote(c) {
  if (!c) return "";
  return [c.beat != null ? `counts ${c.beat} to beat` : null, c.shave ? `scores ${c.shave} less` : null].filter(Boolean).join(", ");
}
export const WORLD_NOTE_TIP = "Changed by the world's consolation or the GM. Taking it still scores its printed value, less any Shave.";

// A card. size: "sm" | "md" | "lg" | "xl" | "stage". The screens draw simple faces; extra.art draws the printed card.
// extra: { class, onclick, title, disabled, badge, art, world }. Press and hold any card to see the printed card full size.
export function cardFace(c, size = "md", extra = {}) {
  if (!c) return h("div", { class: `cf ${size} empty`, "aria-label": "no card" });
  const label = cardLabel(c);
  const kind = c.blessed ? "blessed" : SUITS[c.suit].key;
  const beatBadge = c.beat != null || c.shave
    ? [c.beat != null ? `→${c.beat}` : null, c.shave ? `−${c.shave}` : null].filter(Boolean).join(" ")
    : null;
  const tag = beatBadge || extra.badge || null;
  const tipBody = extra.world ? worldCardText(c) : cardText(c);
  const note = worldNote(c);
  const el = h(extra.onclick ? "button" : "div", {
    class: `cf ${size} ${extra.art ? "" : `simple k-${kind}${c.status ? " is-status" : ""}${c.blessed ? " is-blessed" : ""}`}${tag ? " has-beat" : ""} ${extra.class || ""}`,
    "data-tip": extra.title || `${label}${note ? ` (${note})` : ""}. ${tipBody}`,
    onclick: extra.onclick, "aria-disabled": extra.disabled ? "true" : undefined, type: extra.onclick ? "button" : undefined,
    "aria-label": extra.onclick ? label : undefined,
  },
  extra.art ? art(artName(c), label) : simpleFace(c, !!extra.world),
  tag ? h("span", { class: `beat${beatBadge ? "" : " badge"}` }, tag) : null);
  if (!extra.onclick) el.setAttribute("aria-label", label), el.setAttribute("role", "img");
  el._card = c;
  el._world = !!extra.world;
  if (extra.disabled && extra.onclick) el.addEventListener("click", (e) => e.stopImmediatePropagation(), { capture: true });
  return el;
}

// The card, full size, with its rule in large type. Tap anywhere to close.
export function zoomCard(c, world = false) {
  if (!c) return;
  hideTip();
  const close = () => box.remove();
  const box = h("div", { class: "zoom", role: "dialog", "aria-label": cardLabel(c), onclick: close },
    h("div", { class: "zoom-inner" }, h("div", { class: "cf zoomed" }, art(artName(c), cardLabel(c))),
      h("div", { class: "zoom-text" }, h("h2", {}, cardLabel(c)), h("p", {}, world ? worldCardText(c) : cardText(c)), worldNote(c) ? h("p", { class: "pill" }, worldNote(c)) : null,
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
    hold = setTimeout(() => { held = true; zoomCard(el._card, !!el._world); }, 480);
  }, true);
  for (const t of ["pointerup", "pointercancel", "pointerleave"]) document.addEventListener(t, () => clearTimeout(hold), true);
  document.addEventListener("click", (e) => { if (held) { held = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener("dblclick", (e) => { const el = e.target.closest && e.target.closest(".cf"); if (el && el._card) zoomCard(el._card, !!el._world); });
  document.addEventListener("contextmenu", (e) => { if (e.target.closest && e.target.closest(".cf")) e.preventDefault(); });
}


export const cardBack = (size = "md", extra = {}) => h("div", { class: `cf ${size} back ${extra.class || ""}`, role: "img", "aria-label": "a face-down card" });

// The screens' typeface (Inter Tight) from Google Fonts, falling back to Helvetica or Arial if it can't load.
if (!document.querySelector("link[data-fonts]")) {
  document.head.append(h("link", { rel: "stylesheet", "data-fonts": "", href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800;900&display=swap" }));
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

// ---- Colour coding, the same on every screen ----

// A suit's colour for anything that belongs to it: a character's trump or primary, a status, a consolation.
// The class sets --tone (a fill) and --tone-ink (text); style.css decides what each element does with them.
export const tone = (suit) => (suit && SUITS[suit] ? `tone-${suit}` : "");
// A difficulty word in its band's colour, from easy (green) through extreme (black) to legendary (black and gold).
export function difficultyPill(kind, target, attrs = {}) {
  const word = difficultyWord(kind, target);
  const band = /^beyond/.test(word) ? "beyond" : word.replace(/\s+/g, "-");
  return h("span", { ...attrs, class: `pill diff diff-${band || "none"} ${attrs.class || ""}` }, word || "–");
}
// A result in its colour: green for success, amber for partial, red for failure and bust.
export const resultPill = (result, attrs = {}) => h("span", { ...attrs, class: `pill res res-${result} ${attrs.class || ""}` }, RESULT[result]);
// How many of a character's statuses and Blessed are out (in their deck, discard or hand) of all they own:
// the same words and the same meter for each, on every screen, so a glance shows who is loaded with what.
// extraTip(key) adds to a pill's tooltip; key is a suit or "B".
export function inPlayPills(ch, extraTip = () => "") {
  if (!ch || !ch.reserveStatuses) return null;
  // How heavy: none, a few, about half, most or all. The pill's colour deepens with it.
  const level = (n, of) => (!n ? "none" : n / of <= 1 / 3 ? "lvl-1" : n / of <= 2 / 3 ? "lvl-2" : "lvl-3");
  const pill = (key, name, n, of, cls) => h("span", { class: `pill out-pill ${cls} ${level(n, of)}`,
    "data-tip": `${n} of their ${of} ${name} cards are out: in their deck, discard or hand. ${extraTip(key) || ""}`.trim() },
    name, h("span", { class: "meter", "aria-hidden": "true" }, Array.from({ length: of }, (_, i) => h("i", { class: i < n ? "on" : "" }))), h("b", {}, `${n} out`));
  return h("div", { class: "row in-play" },
    Object.keys(SUITS).map((s) => pill(s, SUITS[s].status, STATUSES_PER_SUIT - (ch.reserveStatuses[s] || 0), STATUSES_PER_SUIT, tone(s))),
    pill("B", "Blessed", BLESSED_PER_PLAYER - (ch.reserveBlessed || 0), BLESSED_PER_PLAYER, "tone-B"));
}

// A running total against its target: on target, close, over.
export const tallyClass = (total, target) => (target == null ? "" : total > target ? "tally-over" : total === target ? "tally-hit" : target - total <= 3 ? "tally-close" : "");

// Difficulty bands a player can suggest: [name, low, high, the target it suggests].
// Difficulty and check sizes come from the engine's rules.mjs (one home for RULES.md's numbers).
export const difficultyBands = (kind) => DIFFICULTY[kind] || DIFFICULTY.standard;
export { difficulty, difficultyHint, presetTricks, CHECK_KINDS } from "/engine/rules.mjs";
export { STATUSES_PER_SUIT };

// A sentence for a resolved trick, from the engine's log entry.
// What the world's consolation did to the next world card, from a worldConsoled event or a trick record's world.
export function worldConsolationText(w) {
  if (!w) return null;
  return {
    brace: `The world Braces: the next world card, the ${w.next}, counts ${w.beat} to beat.`,
    shave: `The world Shaves: the next world card, the ${w.next}, scores 1 less.`,
    peek: `The world Peeks: the next world card, the ${w.was}, is replaced by the ${w.next}.`,
    mirror: `The world Mirrors: the next world card, the ${w.next}, counts ${w.beat} to beat.`,
  }[w.effect] || null;
}

export function trickSentence(e, names) {
  const n = (id) => names[id] || id;
  const play = (id) => e.plays.find((p) => p.id === id);
  const bits = (p) => [p.mirrored ? `Mirrored, it counts ${p.bv}` : "", p.brace ? `Brace +${p.brace}` : "", p.boost ? `${p.boost > 0 ? "+" : ""}${p.boost}` : ""].filter(Boolean).join(", ");
  if (e.winner) {
    const p = play(e.winner);
    const how = { blessed: "Blessed always takes it", highest: `the highest on-suit card${bits(p) ? ` (${bits(p)})` : ""}`, tieBreak: "a tie, settled by suit, then trump" }[e.reason];
    const shaved = (p.shave || 0) + (e.worldShave || 0);
    const wc = e.worldConsolation || (e.world && typeof e.world === "object" ? e.world : null);
    const wcText = worldConsolationText(wc);
    return `${n(e.winner)}'s ${p.label} takes the ${e.worldLabel}: ${how}. +${e.score}${shaved ? ` (Shaved ${shaved})` : ""}.${wcText ? ` ${wcText}` : ""}`;
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
    case "setupDefaulted": return `${n(e.id)} plays with ${SUITS[e.suit].sym} ${SUITS[e.suit].name} as trump, target ${e.target}.`;
    case "retired": return `${n(e.id)} retires.`;
    case "renamed": return `${e.from} is now ${e.to}.`;
    case "unretired": return `${n(e.id)} comes out of retirement.`;
    case "checkCancelled": return "The GM cancels the check. Everyone is back where they were.";
    case "situationSet": return e.situation ? "The GM updates the situation." : "The GM clears the situation.";
    case "gmCardMoved": return e.to === "reserve" ? `GM: removes ${n(e.id)}'s ${e.card} from their ${e.from} (back to reserve).`
      : e.from === "reserve" ? `GM: brings ${n(e.id)}'s ${e.card} in from reserve, to ${PLACE_NAMES[e.to] || e.to}.`
      : `GM: ${n(e.id)}'s ${e.card} moves from ${e.from} to ${PLACE_NAMES[e.to] || e.to}.`;
    case "gmCardAdded": return `GM: ${n(e.id)} gains ${/^[AEIOU8]/.test(e.card) ? "an" : "a"} ${e.card} (${PLACE_NAMES[e.to] || e.to})${e.extra ? ", an extra card" : ""}.`;
    case "gmDeckShuffled": return `GM: ${n(e.id)}'s deck is shuffled.`;
    case "characterCreated": return `${e.name} joins the campaign.`;
    case "blessedGranted": return `${n(e.id)} is granted a Blessed.`;
    case "blessedGiven": return `${n(e.from)} gives a Blessed to ${n(e.to)}.`;
    case "recalculated": return e.drew ? `${n(e.id)} Recalculates and draws a card.` : null;
    case "pricePaid": return `${n(e.id)} pays Stumble's Price.`;
    case "worldConsoled": return worldConsolationText(e);
    case "stumbleToDeck": return `${e.n > 1 ? `${e.n} Stumbles go` : "Stumble goes"} back on top of ${n(e.id)}'s deck.`;
    case "peekReplaced": return `Peek: the next world card, ${e.out}, is replaced by the ${e.in}.`;
    case "peekKept": return `Peek: the ${e.world} stays.`;
    case "itemUsed": return `${n(e.id)} uses ${items[e.itemId] || e.itemId}${e.note ? `: ${e.note}` : ""}.`;
    case "itemGiven": return `${n(e.id)} gains ${items[e.itemId] || e.itemId}.`;
    case "compulsionEdited": return `The GM changes ${n(e.id)}'s compulsion to: ${e.to.join("; ")}.`;
    case "curseViolated": return `${n(e.id)} breaks the compulsion and gains ${e.stress} Stress.`;
    case "rested": return `${n(e.id)} rests.`;
    case "evolved": {
      const status = SUITS[e.suit] ? SUITS[e.suit].status : "status";
      // Older events don't name the cards.
      return `${n(e.id)} evolves: ${e.status ? `one ${status} goes back to reserve` : `two ${status} cards are set aside`}${e.returned ? `, and so does their ${e.returned}` : e.mode === "return" ? ", with a card" : ""}${e.mode === "gain" ? `, and they draw ${SUITS[e.suit] ? SUITS[e.suit].name : ""} cards to keep one` : ""}.`;
    }
    case "evolveKept": return `${n(e.id)} keeps the ${e.card} from evolving.`;
    case "itemLost": return `${n(e.id)} loses ${items[e.itemId] || e.itemId}.`;
    case "reshuffled": return `${n(e.id)} reshuffles.`;
    case "boosted": return `${n(e.id)}'s next card counts ${e.amount > 0 ? "+" : ""}${e.amount}${e.reason ? ` (${e.reason})` : ""}.`;
    case "tallyAdjusted": return `${n(e.id)}'s tally ${e.delta > 0 ? "+" : ""}${e.delta}${e.reason ? ` (${e.reason})` : ""}.`;
    case "targetAdjusted": return `${n(e.id)}'s target is now ${e.target}${e.reason ? ` (${e.reason})` : ""}.`;
    case "worldValueSet": return `A world card now counts ${e.value} for beating${e.reason ? ` (${e.reason})` : ""}.`;
    case "consequenceRemoved": return `Removed ${e.status} consequence from ${n(e.id)}.`;
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

// ---- Shared page pieces: every screen builds these the same way ----

// Each page registers how to redraw itself, so shared controls can redraw after a local choice.
let redrawPage = () => {};
export const setRedraw = (fn) => { redrawPage = fn; };
const redraw = () => redrawPage();

// Small form fields that keep their draft across redraws.
export const sel = (key, opts, value, label) => h("select", { "data-key": key, "aria-label": label || key }, opts.map(([v, t]) => h("option", { value: v, selected: v === value }, t)));
export const num = (key, value, attrs = {}) => h("input", { type: "number", "data-key": key, value, ...attrs });

// A small choice shown as a row of buttons instead of a dropdown. With onpick, picking acts at once;
// without it, the choice is remembered under key (read it with picked(key)).
const choices = {};
export const picked = (key, fallback) => choices[key] ?? fallback;
export const setPicked = (key, v) => { choices[key] = v; };
export function segmented(key, options, value, onpick, label) {
  const cur = onpick ? value : picked(key, value);
  return h("div", { class: "seg", role: "group", "aria-label": label || key }, options.map(([v, text, tip]) =>
    h("button", { class: "small", "aria-pressed": String(v === cur), "data-tip": tip, onclick: () => { if (onpick) { if (v !== cur) onpick(v); } else { choices[key] = v; redraw(); } } }, text)));
}

// The four suits as a row of buttons: four across where they fit, two by two where they don't.
// tip(k) gives each suit's tooltip; exclude leaves suits out.
export function suitChoice(key, value, onpick, label = "Suit", { tip, exclude = [] } = {}) {
  const el = segmented(key, Object.entries(SUITS).filter(([k]) => !exclude.includes(k)).map(([k, x]) => [k, `${x.sym} ${x.name}`, tip ? tip(k) : undefined]), value, onpick, label);
  el.classList.add("suits");
  const keys = Object.keys(SUITS).filter((k) => !exclude.includes(k));
  [...el.children].forEach((b, i) => b.classList.add(tone(keys[i])));
  markSuits(el);
  return el;
}

// A drastic action: click once to arm, again within a few seconds to confirm. Menus use the same pattern
// through an item's `confirm` label.
let armed = null;
export function confirmButton(key, label, confirmLabel, run, tip) {
  const on = armed === key;
  return h("button", { class: `small${on ? " danger-armed" : " ghost"}`, "data-tip": tip, onclick: () => {
    if (on) { armed = null; run(); return; }
    armed = key; redraw();
    setTimeout(() => { if (armed === key) { armed = null; redraw(); } }, 4000);
  } }, on ? confirmLabel : label);
}

// Whether a seat is here, in the same words on every screen. A bot is always "bot", never "away".
export const presence = (s, botKind) => s.role === "bot"
  ? h("span", { class: "presence" }, h("span", { class: "dot bot" }), botKind === "ltr" ? " left-to-right bot" : botKind ? " greedy bot" : " bot")
  : h("span", { class: "presence", "data-tip": s.connected ? "Connected now." : "Not connected." }, h("span", { class: `dot${s.connected ? " on" : ""}` }), s.connected ? " here" : " away");

// Events that are too routine to announce on any screen.
export const QUIET_EVENTS = new Set(["reshuffled", "trickResolved", "trickReady", "locked", "unlocked", "peekAnswered", "approachDeclared", "goalSet"]);
// One toast for what just happened, kept short: a bot joining is quiet, the defaults filled in at the deal become one
// line, and a Peek's outcome joins the trick popup when one is open (its .peek-slot) instead of covering it.
export function announce(events, names, items, ms) {
  const out = [];
  const defaults = [];
  for (const e of events || []) {
    if (QUIET_EVENTS.has(e.type) || (e.type === "characterCreated" && e.bot)) continue;
    if (e.type === "setupDefaulted") { defaults.push(e); continue; }
    const text = eventText(e, names, items);
    const slot = /^peek(Kept|Replaced)$/.test(e.type) && document.querySelector(".peek-slot");
    if (slot && text) { slot.append(h("div", {}, text)); markSuits(slot); continue; }
    out.push(text);
  }
  if (defaults.length) {
    const same = defaults.every((e) => e.target === defaults[0].target);
    out.unshift(`Dealt${same ? `, target ${defaults[0].target}` : ""}: ${defaults.map((e) => `${names[e.id] || e.id} ${SUITS[e.suit].sym}${same ? "" : ` ${e.target}`}`).join(", ")}.`);
  }
  toast(out, ms);
}

// The header every screen shares: the title, a connection dot, and one menu (Rules and Sound, plus the page's own items).
const STATUS_WORDS = { connecting: "Connecting…", connected: "Connected", offline: "Reconnecting…", stopped: "Not connected" };
export function mountHeader({ items = () => [], tip = "Rules, sound and more." } = {}) {
  const status = document.getElementById("status");
  let state = "connecting";
  document.getElementById("tools").replaceChildren(menu("Menu", () => [
    { heading: STATUS_WORDS[state] },
    ...items(),
    { label: "Rules", hint: "new tab", onclick: () => window.open("/rules", "_blank") },
    { label: isSoundOn() ? "Turn sound off" : "Turn sound on", onclick: () => setSoundOn(!isSoundOn()) },
  ], { class: "small ghost", tip }));
  return {
    setTitle: (t) => { document.getElementById("title").textContent = t; },
    setStatus: (s) => {
      state = s;
      status.className = `dot${s === "connected" ? " on" : ""}`;
      status.setAttribute("data-tip", STATUS_WORDS[s]);
    },
  };
}

// ---- Notes: plain text kept by the game, edited in place on every screen ----
// A panel that slides in from the side (a sheet from the bottom on phones). Tabs for the notes this screen may see:
// Shared (everyone edits), Mine (only you), GM (only the GM). Typing saves after a pause; other screens update live.
const NOTE_TABS = { shared: ["Shared", "Everyone at the table reads and edits these."], mine: ["Mine", "Only you see these."], gm: ["GM", "Only the GM sees these."] };
export function notesPanel({ send, editable = true }) {
  const notes = {}; // scope -> { text, by, at }
  let scope = null, dirty = false, timer = null;
  const status = h("span", { class: "small muted" });
  const area = h("textarea", { class: "notes-text", maxlength: 20000, spellcheck: "true", "aria-label": "Notes", readonly: !editable });
  const tabs = h("div", { class: "notes-tabs" });
  const importBtn = editable ? h("button", { class: "small ghost", "data-tip": "Add the text of a Google Doc shared as Anyone with the link to the end of these notes.", onclick: (e) => openMenuAt(e.currentTarget, [
    { label: "Import a Google Doc", fields: [{ type: "text", placeholder: "https://docs.google.com/document/d/…", maxlength: 400 }], submit: "Add its text", onsubmit: ([url]) => { if (url) { status.textContent = "Importing…"; send({ op: "importNotes", scope, url }); } } },
  ]) }, "Import a Google Doc") : null;
  const panel = h("aside", { class: "notes-panel", hidden: true, "aria-label": "Notes" },
    h("div", { class: "notes-head" }, h("strong", {}, "Notes"), tabs, h("button", { class: "small ghost push", "aria-label": "Close notes", onclick: () => toggle(false) }, "Close")),
    area, h("div", { class: "row" }, status, importBtn ? h("span", { class: "push" }, importBtn) : null));
  document.body.append(panel);
  const save = () => { if (!scope || !dirty) return; dirty = false; send({ op: "editNotes", scope, text: area.value }); status.textContent = "Saved"; };
  area.addEventListener("input", () => { dirty = true; status.textContent = "Saving…"; clearTimeout(timer); timer = setTimeout(save, 600); });
  area.addEventListener("blur", () => { clearTimeout(timer); save(); });
  const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
  const showStatus = () => { const n = notes[scope]; if (!dirty) status.textContent = n && n.at ? `Last edited by ${n.by}, ${ago(n.at)}` : editable ? "Nothing yet. Start typing." : "Nothing yet."; };
  function show(next) {
    if (dirty) { clearTimeout(timer); save(); }
    scope = next;
    tabs.replaceChildren(...Object.keys(notes).map((k) => h("button", { class: "small", "aria-pressed": String(k === scope), "data-tip": NOTE_TABS[k][1], onclick: () => show(k) }, NOTE_TABS[k][0])));
    area.value = (notes[scope] && notes[scope].text) || "";
    area.placeholder = scope === "shared" ? "Shared notes: names, places, clues, plans…" : scope === "gm" ? "Your GM notes: only you see these." : "Your own notes: only you see these.";
    showStatus();
  }
  function toggle(open = panel.hidden) {
    panel.hidden = !open;
    document.body.classList.toggle("notes-open", open);
    if (open) { show(scope && notes[scope] ? scope : Object.keys(notes)[0]); if (editable) area.focus({ preventScroll: true }); }
    else save();
  }
  return {
    current: () => notes,
    // New text from the host. While you're typing in the same notes, your text stays; your next save wins.
    receive(incoming) {
      Object.assign(notes, incoming);
      if (!scope || !notes[scope]) scope = Object.keys(notes)[0];
      if (panel.hidden) return;
      if (!dirty && incoming[scope]) {
        const [a, b] = [area.selectionStart, area.selectionEnd];
        area.value = incoming[scope].text || "";
        if (document.activeElement === area) try { area.setSelectionRange(a, b); } catch {}
      }
      if (Object.keys(incoming).some((k) => !tabs.textContent.includes(NOTE_TABS[k][0]))) show(scope);
      else showStatus();
    },
    toggle,
    item: () => ({ label: panel.hidden ? "Notes" : "Hide notes", hint: Object.keys(notes).map((k) => NOTE_TABS[k][0].toLowerCase()).join(" · "), tip: "Plain-text notes, kept with the campaign.", onclick: () => toggle() }),
  };
}

// Every trick so far, newest first: the same block on every screen.
export const trickLog = (log, names, { open = false } = {}) => (log && log.length
  ? h("details", { class: "panel", open }, h("summary", {}, "Every trick so far"), h("div", { class: "log log-full" }, [...log].reverse().map((e) => h("div", { class: e.winner ? "won" : "kept" }, `${e.trick + 1}. ${trickSentence(e, names)}`))))
  : null);

// Each participant's result, with what it calls for.
export const resultsList = (results, names) => h("ul", { class: "results" }, Object.entries(results).map(([id, r]) =>
  h("li", {}, h("strong", {}, `${names[id]} `), resultPill(r.result), " ", h("span", { class: "muted" }, `(${r.tally} of ${r.target}). `), RESULT_NOTE[r.result], r.dies ? h("strong", {}, " Does not survive.") : null)));

// ---- The campaign's history ----

const when = (t) => (t ? new Date(t).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

// Split the journal into chapters: each check, and what happened before and between them. Checks recorded before
// the journal existed (older saves) come first, from state.history alone.
function chapters(view) {
  const out = [];
  let cur = null;
  for (const e of view.journal || []) {
    if (e.type === "checkBegun") { cur = { kind: "check", id: e.check, start: e, events: [] }; out.push(cur); continue; }
    if ((e.type === "checkClosed" || e.type === "checkCancelled") && cur && cur.kind === "check") { cur.end = e; cur = null; continue; }
    if (e.type === "journalStarted") { cur = { kind: "between", start: e, events: [], late: true }; out.push(cur); continue; }
    if (!cur) { cur = { kind: "between", start: e, events: [] }; out.push(cur); }
    cur.events.push(e);
  }
  const seen = new Set(out.filter((c) => c.kind === "check").map((c) => c.id));
  const older = (view.history || []).filter((x) => !seen.has(x.id)).map((x) => ({ kind: "check", id: x.id, events: [], end: { type: "checkClosed" } }));
  return [...older, ...out];
}

// Event lines for a chapter, with repeats folded together: "Wren gains Stumble. ×2".
function eventLines(events, names, items) {
  const out = [];
  for (const t of events.map((e) => eventText(e, names, items)).filter(Boolean)) {
    const prev = out[out.length - 1];
    if (prev && prev.text === t) prev.n++; else out.push({ text: t, n: 1 });
  }
  return out.length ? h("ul", { class: "history-events" }, out.map((x) => h("li", {}, x.text, x.n > 1 ? h("span", { class: "muted" }, ` ×${x.n}`) : null))) : null;
}

// Who plays a character, in a few words: "Priya", "greedy bot", "the GM". From the seats when the page has them.
function playedBy(c, seats) {
  if (c.bot) return c.bot === "ltr" ? "left-to-right bot" : "greedy bot";
  const seat = (seats || []).find((s) => s.role !== "bot" && (s.chars || [s.charId]).includes(c.id));
  if (seat) return seat.role === "gm" ? "the GM" : seat.name;
  return c.controller === "gm" ? "the GM" : "player";
}
const whoTag = (c, seats) => (c ? h("span", { class: `who-tag${c.bot ? " is-bot" : ""}`, "data-tip": c.bot ? "Played by a bot." : "Played by a person." }, c.bot ? "bot" : playedBy(c, seats)) : null);

// A cast square goes to its check: it scrolls into view and flashes, so the eye lands on it.
function jumpTo(id) {
  const go = () => {
    const el = document.getElementById(`history-check-${id}`);
    if (!el) return;
    // Stop below whatever stays pinned to the top of the screen (the GM's banner, the phone's score bar).
    const pinned = Math.max(0, ...[...document.querySelectorAll(".next-step, .hud")].filter((x) => getComputedStyle(x).position === "sticky").map((x) => x.getBoundingClientRect().height));
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - pinned - 12, behavior: reducedMotion() ? "auto" : "smooth" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1500);
  };
  return { role: "button", tabindex: "0", "aria-label": `Go to check ${id}`, onclick: go, onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } } };
}

// Who has played, how each check went for them, and whether they're still with us.
function cast(view, seats) {
  const chars = Object.values(view.characters);
  if (!chars.length) return null;
  const diedIn = Object.fromEntries((view.journal || []).filter((e) => e.type === "died").map((e) => [e.id, e.check]));
  // When each character joined, for those who came in after the first check: a replacement reads as one.
  const joinedAfter = Object.fromEntries((view.journal || []).filter((e) => e.type === "characterCreated" && e.check > 0).map((e) => [e.id, e.check]));
  const retiredAfter = {};
  for (const e of view.journal || []) { if (e.type === "retired") retiredAfter[e.id] = e.check; if (e.type === "unretired") delete retiredAfter[e.id]; }
  return h("div", { class: "panel stack" }, h("h2", {}, "The cast"),
    h("div", { class: "cast" }, chars.map((c) => h("div", { class: `cast-row${!c.alive || c.retired ? " benched" : ""}` },
      h("strong", {}, c.name),
      h("span", { class: "small muted" }, c.bot ? playedBy(c, seats) : `played by ${playedBy(c, seats)}`, joinedAfter[c.id] ? ` · joined after check ${joinedAfter[c.id]}` : ""),
      !c.alive ? h("span", { class: "pill bad" }, diedIn[c.id] ? `died in check ${diedIn[c.id]}` : "dead") : c.retired ? h("span", { class: "pill warn" }, "retired") : null,
      // One square per check, so every row lines up: the result, grey where they sat out, empty before they
      // joined or after they died or retired.
      h("span", { class: "res-strip" }, (view.history || []).map((x) => {
        const r = x.results && x.results[c.id];
        if (r) return h("span", { class: `res-dot res-${r.result}`, ...jumpTo(x.id), "data-tip": `Check ${x.id}: ${RESULT[r.result]}, ${r.tally} of ${r.target}. Select to go to it.` });
        const away = (joinedAfter[c.id] && x.id <= joinedAfter[c.id]) || (diedIn[c.id] && x.id > diedIn[c.id]) || (retiredAfter[c.id] && x.id > retiredAfter[c.id]);
        return away ? h("span", { class: "res-dot res-away", "aria-hidden": "true" }) : h("span", { class: "res-dot res-out", ...jumpTo(x.id), "data-tip": `Check ${x.id}: sat out. Select to go to it.` });
      }))))));
}

function checkChapter(ch, view, names, items, seats) {
  const rec = (view.history || []).find((x) => x.id === ch.id);
  const state = !ch.end ? "under way" : ch.end.type === "checkCancelled" ? "cancelled" : null;
  const kind = rec ? rec.kind : ch.start && ch.start.kind;
  const tricks = rec ? rec.tricks : ch.start && ch.start.tricks;
  const ids = rec && rec.results ? Object.keys(rec.results) : (ch.start && ch.start.participants) || [];
  const head = h("div", { class: "headrow" }, h("h2", {}, `Check ${ch.id}`),
    h("span", { class: "pill" }, [kind ? `${(CHECK_KINDS[kind] && CHECK_KINDS[kind].label) || kind}` : null, tricks ? `${tricks} tricks` : null].filter(Boolean).join(" · ")),
    state ? h("span", { class: `pill${state === "cancelled" ? " warn" : ""}` }, state) : null,
    h("span", { class: "small muted push" }, when(ch.start && ch.start.at)));
  const rows = rec && rec.results ? h("table", { class: "history-results" }, h("tbody", {}, ids.map((id) => {
    const r = rec.results[id];
    const p = (rec.players && rec.players[id]) || {};
    return h("tr", {},
      h("td", {}, h("strong", {}, names[id] || id), " ", whoTag(view.characters[id], seats)),
      // The trump belongs to this goal, not to the person: it sits with the goal, in its suit's colour.
      h("td", { class: "history-goal" },
        p.approach ? h("span", { class: `pill tinted ${tone(p.approach)}`, "data-tip": "The trump for this goal." }, `${SUITS[p.approach].sym} ${SUITS[p.approach].name}`) : null, " ",
        p.survival ? h("strong", {}, "Survive") : p.goal ? h("em", {}, `“${p.goal}”`) : h("span", { class: "muted" }, rec.players ? "spoken at the table" : "")),
      h("td", {}, resultPill(r.result)),
      h("td", { class: tallyClass(r.tally, r.target) }, `${r.tally} of ${r.target}`),
      h("td", {}, r.dies ? h("span", { class: "pill bad" }, "died") : null));
  }))) : h("p", { class: "small muted" }, ids.length ? `With ${ids.map((id) => names[id] || id).join(", ")}.` : "");
  const cons = rec && rec.consequences && rec.consequences.length ? h("div", { class: "row" }, h("span", { class: "small muted" }, "Consequences"),
    rec.consequences.map((c) => h("span", { class: `pill tinted ${tone(c.suit)}` }, `${names[c.charId] || c.charId}: ${SUITS[c.suit].sym} ${SUITS[c.suit].status}${c.compulsion ? ` (${c.compulsion})` : ""}`))) : null;
  const situation = (rec && rec.situation) || (ch.start && ch.start.situation);
  return h("section", { id: `history-check-${ch.id}`, class: `panel stack history-check${state === "cancelled" ? " benched" : ""}` }, head,
    situation ? h("p", { class: "situation" }, h("em", {}, situation)) : null, rows, cons,
    eventLines(ch.events, names, items),
    rec && rec.log && rec.log.length ? h("details", {}, h("summary", { class: "small" }, `The ${rec.log.length} tricks`),
      h("div", { class: "log log-full" }, rec.log.map((e) => h("div", { class: e.winner ? "won" : "kept" }, `${e.trick + 1}. ${trickSentence(e, names)}`)))) : null);
}

function betweenChapter(ch, first, names, items) {
  const list = eventLines(ch.events, names, items);
  if (!list && !ch.late) return null;
  return h("section", { class: "panel stack history-between" },
    h("div", { class: "headrow" }, h("h3", { class: "flush" }, ch.late ? "From here on, the history is complete" : first ? "Before the first check" : "Between checks"),
      h("span", { class: "small muted push" }, when(ch.start && ch.start.at))),
    ch.late ? h("p", { class: "small muted" }, "This campaign began before the app kept a history, so earlier checks show only their results.") : null,
    list);
}

// The whole campaign, newest first: the cast, then each check and what happened around it, then the notes this
// screen may read. The same block on every screen; what it shows comes from that screen's view.
export function historyPanel(view, { items = {}, notes = null, seats = [] } = {}) {
  const names = Object.fromEntries(Object.values(view.characters).map((c) => [c.id, c.name]));
  const chs = chapters(view);
  const firstCheck = chs.findIndex((c) => c.kind === "check");
  const blocks = chs.map((c, i) => (c.kind === "check" ? checkChapter(c, view, names, items, seats) : betweenChapter(c, firstCheck < 0 || i < firstCheck, names, items))).filter(Boolean).reverse();
  const noteBlocks = notes ? Object.entries(notes).filter(([, n]) => n && n.text).map(([k, n]) => h("div", { class: "stack-tight" },
    h("div", { class: "headrow" }, h("strong", {}, NOTE_TABS[k] ? NOTE_TABS[k][0] : k), n.at ? h("span", { class: "small muted" }, `last edited by ${n.by}, ${when(n.at)}`) : null),
    h("div", { class: "history-notes" }, n.text))) : [];
  return [
    cast(view, seats),
    blocks.length ? h("div", { class: "history" }, blocks) : h("div", { class: "panel muted" }, "Nothing has happened yet. The history fills in as characters join and checks are played."),
    noteBlocks.length ? h("div", { class: "panel stack" }, h("h2", {}, "Notes"), noteBlocks) : null,
  ].filter(Boolean);
}

// Whether someone is still choosing this trick, shown inline with their name: a pulsing "choosing…" or "locked in".
// A chip that has just turned from choosing to locked in glows briefly, so the change is noticed without reading.
const chipSeen = { choosing: new Set(), lockedAt: new Map() };
export function choosingChip(ck, id) {
  if (!ck || ck.phase !== "play") return null;
  const p = ck.players[id];
  if (p.busted) return h("span", { class: "pill chip-busted", "data-tip": "Over target: busted and sitting out the rest of this check." }, "busted");
  const key = `${ck.id}:${ck.trick}:${id}`;
  if (p.locked) {
    if (chipSeen.choosing.has(key) && !chipSeen.lockedAt.has(key)) chipSeen.lockedAt.set(key, Date.now());
    const fresh = Date.now() - (chipSeen.lockedAt.get(key) ?? 0) < 1500;
    return h("span", { class: `pill chip-locked${fresh ? " just" : ""}`, "data-tip": "Locked in a card for this trick." }, "locked in");
  }
  if (p.handCount) chipSeen.choosing.add(key);
  if (!p.handCount) return h("span", { class: "pill muted", "data-tip": "No cards left: sits this trick out." }, "sits out");
  return h("span", { class: "pill chip-choosing", "data-tip": "Still choosing a card for this trick." }, h("span", { class: "pulse-dot", "aria-hidden": "true" }), "choosing…");
}

// Compact ally status strip: each participant's lock state, tally/target, trump, and active consolations.
export function choosingList(ck, names, me) {
  return h("div", { class: "people choosing-list" }, ck.participants.map((id) => {
    const p = ck.players[id];
    const need = p.target != null ? p.target - p.total : null;
    const tallyTip = need == null ? "Tally so far."
      : need < 0 ? `Busted (over by ${-need}).`
      : need === 0 ? "Exactly on target (critical)."
      : `Needs ${need} more for exact hit.`;
    return h("div", { class: `person-row ally-row ${tone(p.approach)}${id === me ? " me" : ""}${p.busted ? " is-busted" : ""}` },
      h("div", { class: "ally-top" },
        h("strong", { class: "ally-name" }, id === me ? `${names[id]} (you)` : names[id]),
        choosingChip(ck, id),
        h("span", { class: `pill ally-score ${tallyClass(p.total, p.target)}`, "data-tip": tallyTip }, `${p.total} / ${p.target ?? "?"}`)),
      h("div", { class: "ally-meta" },
        p.approach ? h("span", { class: `pill tinted ${tone(p.approach)}`, "data-tip": `Trump: ${SUITS[p.approach].name}.` }, `${SUITS[p.approach].sym} ${SUITS[p.approach].name}`) : null,
        p.survival ? h("span", { class: "pill bad", "data-tip": "Forced survival goal." }, "Survival") : null,
        ...consolationPills(p),
        p.boost ? h("span", { class: "pill good", "data-tip": "GM adjustment to their next card." }, `Next ${p.boost > 0 ? "+" : ""}${p.boost}`) : null));
  }));
}

// List or grid: each screen can show its people as a list or as a grid of cards. "auto" (the default) follows the
// window: a grid when it's wide, a list when it's narrow, switching live as the window is resized or a tablet turns.
// A screen's choice is saved on this device; the menu cycles auto → grid → list.
const WIDE = "(min-width: 900px)";
export function layoutSwitch(page) {
  const key = `trick:layout:${page}`;
  let mode = "auto";
  try { const saved = localStorage.getItem(key); if (["auto", "grid", "list"].includes(saved)) mode = saved; } catch {}
  const wide = matchMedia(WIDE);
  const showing = () => (mode === "auto" ? (wide.matches ? "grid" : "list") : mode);
  const apply = () => document.body.classList.toggle("layout-grid", showing() === "grid");
  wide.addEventListener("change", () => { if (mode === "auto") { apply(); redraw(); } });
  apply();
  const NEXT = { auto: "grid", grid: "list", list: "auto" };
  return {
    item: () => ({ label: `Layout: ${mode === "auto" ? `auto (${showing()} now)` : mode}`, hint: `next: ${NEXT[mode]}`,
      tip: "Auto shows a grid on wide screens and a list on narrow ones, and follows the window as it changes.",
      onclick: () => { mode = NEXT[mode]; try { localStorage.setItem(key, mode); } catch {} apply(); redraw(); } }),
  };
}


// What a card counts for beating right now, with Brace, Mirror and the GM's adjustment (the engine's countsAs).
export const countsNow = (c, p) => (c.blessed ? null : countsAs(c, p.mirror) + (p.brace || 0) + (p.boost || 0));

// A hand to choose from: tap to choose, tap again to see the card full size; a white bar across each card that
// can beat the world card, and the value it counts now when an effect changes it. The phone and the GM's own
// character both use it. ui is { chosen, price } and is updated in place. Stumble's Price is asked for only in older
// games (rules without stumble "deck"); in new ones a played Stumble goes on top of the deck at cleanup by itself.
export function handDock({ hand, legal, p, w, ui, rules, onLock, size = "md" }) {
  const chosen = hand.find((c) => c.id === ui.chosen);
  const needsPrice = !(rules && rules.stumble === "deck") && chosen && chosen.status && chosen.suit === "D" && hand.some((c) => c.id !== chosen.id && !c.status && !c.blessed);
  const forced = legal.length < hand.length;
  const toBeat = w.beat ?? w.v;
  const hint = needsPrice ? (ui.price ? "Price chosen. Lock in when ready." : "Stumble's Price: tap an ordinary card to discard.")
    : forced ? `The situation finds your weakness: you must play your ${SUITS[w.suit].status}.`
    : chosen ? `${cardLabel(chosen)}: ${cardText(chosen)}`
    : `Pick a card. A white bar means it can beat the ${w.label}${w.beat != null ? ` (counts ${w.beat})` : ""}. Hold a card to see it full size.`;
  return [
    h("p", { class: `hint${forced || needsPrice ? " pill warn" : ""}` }, hint),
    h("div", { class: "fan" }, hand.map((c) => {
      const isLegal = legal.includes(c.id);
      const pickPrice = needsPrice && c.id !== chosen.id && !c.status && !c.blessed;
      const n = countsNow(c, p);
      const canBeat = isLegal && (c.blessed || c.suit === w.suit || c.suit === p.approach) && (c.blessed || n > toBeat);
      return cardFace(c, size, {
        class: [ui.chosen === c.id ? "chosen" : "", ui.price === c.id ? "price" : "", forced && isLegal ? "forced" : "", canBeat && !needsPrice ? "can-beat" : ""].join(" "),
        disabled: !(isLegal || pickPrice),
        badge: n != null && n !== c.v ? `→${n}` : null,
        title: `${c.label}${n != null && n !== c.v ? ` (counts ${n} now)` : ""}. ${cardText(c)}`,
        onclick: () => {
          if (pickPrice) ui.price = c.id;
          else if (ui.chosen === c.id) return zoomCard(c);
          else { ui.chosen = c.id; ui.price = null; }
          redraw();
        },
      });
    })),
    h("button", { class: "primary big", disabled: !chosen || (needsPrice && !ui.price), onclick: () => { const cardId = chosen.id, priceCardId = ui.price || undefined; ui.chosen = null; ui.price = null; onLock(cardId, priceCardId); } }, chosen ? `Lock in ${chosen.label}` : "Choose a card"),
  ];
}
