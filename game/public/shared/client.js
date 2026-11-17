// Shared browser code: the room connection, card labels and small DOM helpers.
// Phase 2 screens are deliberately bare; phase 3 replaces the look.

export const SUITS = { S: { name: "Strength", sym: "♥", status: "Injury", cls: "s" }, D: { name: "Dexterity", sym: "♠", status: "Stumble", cls: "d" }, I: { name: "Intelligence", sym: "♦", status: "Stress", cls: "i" }, W: { name: "Weird", sym: "♣", status: "Curse", cls: "w" } };

export const params = new URLSearchParams(location.search);

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
    act(action) { const s = ++seq; ws.send(JSON.stringify({ type: "action", seq: s, action })); return s; },
    manage(op) { const s = ++seq; ws.send(JSON.stringify({ type: "manage", seq: s, ...op })); return s; },
    forget() { try { localStorage.removeItem(key); } catch {} },
  };
}

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, "");
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
  return el;
}

export function cardEl(c, attrs = {}) {
  if (!c) return h("span", { class: "card empty" }, "—");
  const cls = c.blessed ? "b" : SUITS[c.suit].cls;
  return h("span", { class: `card ${cls}${c.status ? " status" : ""}`, title: c.label, ...attrs }, c.label);
}

export const RESULT = { critical: "Critical success", success: "Success", partial: "Partial", failure: "Failure", bust: "Bust" };

export const REASONS = {
  blessed: "Blessed takes it", blessedTie: "two Blessed tie: the world takes it", worldHighest: "the world card is highest",
  highest: "highest on-suit card", blocked: "blocked by an off-suit card", tieBreak: "tie settled by suit, then trump", tieLevel: "tie stays level: the world takes it",
};

export function describeTrick(entry, names, label) {
  const who = entry.winner ? `${names[entry.winner] || entry.winner} takes it (${REASONS[entry.reason]}), scoring ${entry.score}` : `The world takes it: ${REASONS[entry.reason]}${entry.by ? ` (${names[entry.by] || entry.by})` : ""}`;
  return `Trick ${entry.trick + 1}: ${who}.`;
}

export function suitSelect(id, value, exclude = []) {
  const sel = h("select", { id });
  for (const [k, s] of Object.entries(SUITS)) if (!exclude.includes(k)) sel.append(h("option", { value: k, selected: k === value }, `${s.sym} ${s.name}`));
  return sel;
}

export function toast(text) {
  const t = h("div", { class: "toast" }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 4000);
}
