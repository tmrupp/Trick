// Outcome odds at every target, for choosing targets (RULES.md difficulty table).
// Usage: node scripts/simulate_targets.mjs [trials per point]   (default 5000)
// Random 21-card decks, trump = each deck's biggest suit; need-seeking bots that never bust by choice.
// Rules: world leads; simultaneous; the single highest card wins if on-suit; the winner scores the world card
// (Mirror: 11 minus it); suit-then-trump tie-break; Brace / Recalculate / Mirror; Dexterity is Wait, or the old Slip
// for comparison. Standard checks are 3 tricks per player + 1, quick checks 2 per player + 1, solo 6.
const SUITS = ['S', 'D', 'I', 'W'];
const sh = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const POOL = []; for (const s of SUITS) for (let v = 1; v <= 10; v++) { POOL.push({ s, v }); POOL.push({ s, v }); }
function randomDeck() {
  const d = sh([...POOL]).slice(0, 21).map((c) => ({ ...c }));
  const cnt = { S: 0, D: 0, I: 0, W: 0 }; d.forEach((c) => cnt[c.s]++);
  const tr = SUITS.reduce((a, b) => (cnt[b] > cnt[a] ? b : a));
  return { deck: sh(d), tr };
}
const worldDeck = () => { const d = []; for (const s of SUITS) for (let v = 1; v <= 10; v++) d.push({ s, v }); return sh(d); };

// Pick a card. `seen` is the list of revealed plays when Waiting, else null (choose blind against the world card).
function pick(p, w, T, seen) {
  const need = T - p.tally;
  const prize = p.mirror ? 11 - w.v : w.v;
  let top = w.v, allyWinning = false;
  if (seen) {
    top = Math.max(w.v, ...seen.map((x) => x.bv));
    const at = seen.filter((x) => x.bv === top);
    allyWinning = top > w.v && at.length === 1 && at[0].on;
  }
  const opts = p.hand.map((c) => {
    const bv = c.v + p.brace;
    const on = c.s === p.tr || c.s === w.s;
    const beats = on && bv > top;
    let sc = beats ? (p.tally + prize > T ? 999 : need - prize) : need + bv * 0.01;
    if (!beats && seen && allyWinning && bv >= top) sc += 50; // do not tie or block an ally who is winning
    if (!beats && p.dex === 'slip' && c.s === 'D') sc -= 0.005; // a losing Spade comes back: the best pass
    return { c, bv, on, beats, sc };
  });
  opts.sort((a, b) => a.sc - b.sc);
  return opts[0];
}

function run(P, T, dex, trials, tricks) {
  const N = tricks(P); const tally = { crit: 0, succ: 0, part: 0, fail: 0, bust: 0 };
  for (let t = 0; t < trials; t++) {
    const pl = [];
    for (let i = 0; i < P; i++) { const { deck, tr } = randomDeck(); pl.push({ tr, deck, hand: deck.splice(0, N), tally: 0, brace: 0, mirror: false, wait: false, dex }); }
    const row = worldDeck().slice(0, N);
    row.forEach((w, k) => {
      const last = k === N - 1;
      const plays = [], revealed = [];
      for (const p of [...pl.filter((q) => !q.wait), ...pl.filter((q) => q.wait)]) {
        if (!p.hand.length) { p.wait = false; continue; }
        const o = pick(p, w, T, p.wait ? revealed : null);
        p.hand.splice(p.hand.indexOf(o.c), 1);
        const play = { p, c: o.c, bv: o.bv, on: o.on, mirrored: p.mirror };
        p.brace = 0; p.mirror = false;
        if (!p.wait) revealed.push(play);
        p.wait = false;
        plays.push(play);
      }
      const top = Math.max(w.v, ...plays.map((x) => x.bv));
      const at = plays.filter((x) => x.bv === top);
      let win = null;
      if (top > w.v && at.every((x) => x.on)) {
        if (at.length === 1) win = at[0];
        else { // suit, then trump
          const sc = at.map((x) => (x.c.s === w.s ? 2 : 0) + (x.c.s === x.p.tr ? 1 : 0)); const best = Math.max(...sc);
          if (sc.filter((v) => v === best).length === 1) win = at[sc.indexOf(best)];
        }
      }
      if (win) win.p.tally += win.mirrored ? 11 - w.v : w.v;
      if (last) return;
      for (const x of plays) {
        if (x === win) continue;
        const p = x.p, s = x.c.s;
        if (s === 'S') p.brace = x.c.v;
        else if (s === 'D') { if (dex === 'slip') p.hand.push(x.c); else p.wait = true; }
        else if (s === 'W') p.mirror = true;
        else if (p.hand.length && p.deck.length) { // Recalculate: drop the highest card (least likely to land exactly), draw 1
          p.hand.sort((a, b) => b.v - a.v); p.hand.shift(); p.hand.push(p.deck.shift());
        }
      }
    });
    for (const p of pl) {
      const d = T - p.tally;
      tally[d < 0 ? 'bust' : d === 0 ? 'crit' : d <= 3 ? 'succ' : d <= 6 ? 'part' : 'fail']++;
    }
  }
  const n = trials * P;
  return Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, Math.round((1000 * v) / n) / 10]));
}

const TRIALS = Number(process.argv[2]) || 5000;
const out = { trials: TRIALS, standard: {}, quick: {}, solo: {} };
const kinds = [
  ["standard", [2, 3, 4, 5], 20, (P) => 3 * P + 1, ["wait", "slip"]],
  ["quick", [2, 3, 4, 5], 12, (P) => 2 * P + 1, ["wait"]],
  ["solo", [1], 12, () => 6, ["wait"]],
];
for (const [kind, Ps, maxT, tricks, dexes] of kinds) for (const dex of dexes) {
  out[kind][dex] = {};
  for (const P of Ps) {
    out[kind][dex][P] = [];
    for (let T = 1; T <= maxT; T++) out[kind][dex][P].push({ T, ...run(P, T, dex, P === 1 ? TRIALS * 4 : TRIALS, tricks) });
  }
}
console.log(JSON.stringify(out));
