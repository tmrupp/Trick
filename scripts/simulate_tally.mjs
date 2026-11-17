// Monte Carlo simulation of Tally checks (RULES.md) for concrete table situations, under the adopted rules by default.
// Usage: node scripts/simulate_tally.mjs [trials] [name filter regex]   (default 20000 per situation, all situations)
// Bots are simple and do not read each other, so treat results as relative, not as table odds.
const TRIALS = Number(process.argv[2]) || 20000;
const ONLY = process.argv[3] ? new RegExp(process.argv[3]) : null;
const SUITS = ["S", "D", "I", "W"]; // Strength, Dexterity, Intelligence, Weird
const STATUS = { S: "Injury", D: "Stumble", I: "Stress", W: "Curse" };

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const card = (s, v) => ({ s, v });
const status = (s) => ({ s, v: 0, st: true });

// The 21-card starter: 2,4,6,8 of every suit, A,5,9 of the primary, 3,7 of the secondary.
function starterDeck(primary, secondary) {
  const d = [];
  for (const s of SUITS) for (const v of [2, 4, 6, 8]) d.push(card(s, v));
  for (const v of [1, 5, 9]) d.push(card(primary, v));
  for (const v of [3, 7]) d.push(card(secondary, v));
  return d;
}
// A later-campaign deck: 21 random ordinary cards from two decks' A–10.
function evolvedDeck() {
  const pool = [];
  for (const s of SUITS) for (let v = 1; v <= 10; v++) pool.push(card(s, v), card(s, v));
  return shuffle(pool).slice(0, 21);
}
const worldRow = (n) => { const d = []; for (const s of SUITS) for (let v = 1; v <= 10; v++) d.push(card(s, v)); return shuffle(d).slice(0, n); };

// Result ladder from RULES.md.
function result(tally, target) {
  if (tally > target) return "bust";
  const short = target - tally;
  if (short === 0) return "critical";
  if (short <= 3) return "success";
  if (short <= 6) return "partial";
  return "failure";
}
const RANK = { critical: 4, success: 3, partial: 2, failure: 1, bust: 0 };

// Which losing card to spend when passing: Slip returns Dexterity, statuses are free, Stumble costs a card.
// With a Dexterity consolation that keeps no card (spec.dex), a losing Spade ranks with Weird instead.
const passOrder = (c, spec, w) => {
  if (c.st) return c.s === "D" ? 6 : 1;
  if (c.s === "D") {
    if (!spec.dex || spec.dex === "return" || spec.dex === "return-noloop") return 0;
    if (spec.dex === "duck") return c.v < w.v ? 0 : 3;
    return 2;
  }
  return c.s === "W" ? 2 : c.s === "S" ? 3 : 4;
};

function choose(p, w, table, hidden, wb = w.v, spec = {}) {
  const need = p.target - p.tally;
  const wv = hidden ? 5.5 : wb; // the value to beat; with a hidden world value, bots guess the average
  const pv = hidden ? 5.5 : w.v; // the value it scores
  const prize = p.mirror ? 11 - pv : pv;
  const opts = p.hand.map((c) => {
    const bv = c.v + p.brace;
    const on = c.s === p.trump || c.s === w.s || p.feint;
    return { c, bv, beats: on && bv > wv };
  });
  const beaters = opts.filter((o) => o.beats).sort((a, b) => a.bv - b.bv);
  let want = beaters.length && prize <= need;
  // Cooperative bots yield a world card that lands an ally exactly, unless it lands them exactly too.
  if (want && p.policy === "yield" && !hidden && prize !== need) {
    if (table.some((q) => q !== p && q.target - q.tally === w.v)) want = false;
  }
  if (want) return { ...beaters[beaters.length > 1 && beaters[0].bv - wv < 2 ? 1 : 0], want: true };
  const losers = opts.filter((o) => !o.beats).sort((a, b) => passOrder(a.c, spec, w) - passOrder(b.c, spec, w) || a.c.v - b.c.v);
  if (losers.length) return { ...losers[0], want: false };
  return { ...beaters[0], want: false, forced: true }; // every card in hand would win
}

// Wait: this player chooses after seeing everyone else's revealed cards.
// Take the world card outright if it fits; otherwise lose without stealing or blocking an ally's win.
function chooseSeen(p, w, plays, wb, spec) {
  const need = p.target - p.tally;
  const prize = p.mirror ? 11 - w.v : w.v;
  const top = Math.max(wb, ...plays.map((x) => x.bv));
  const atTop = plays.filter((x) => x.bv === top);
  const allyWinning = top > wb && atTop.length === 1 && (atTop[0].c.s === atTop[0].p.trump || atTop[0].c.s === w.s || atTop[0].feint);
  const opts = p.hand.map((c) => {
    const bv = c.v + p.brace;
    const on = c.s === p.trump || c.s === w.s || p.feint;
    return { c, bv, wins: on && bv > top };
  });
  const winners = opts.filter((o) => o.wins).sort((a, b) => a.bv - b.bv);
  if (winners.length && prize <= need) return { ...winners[0], want: true };
  const order = (a, b) => passOrder(a.c, spec, w) - passOrder(b.c, spec, w) || a.c.v - b.c.v;
  const safe = opts.filter((o) => !o.wins && !(allyWinning && o.bv >= top)).sort(order);
  if (safe.length) return { ...safe[0], want: false };
  const losers = opts.filter((o) => !o.wins).sort(order);
  if (losers.length) return { ...losers[0], want: false };
  return { ...winners[0], want: false, forced: true };
}

// The adopted rules (RULES.md): suit-then-trump ties, forced statuses, Wait. A spec overrides any of them:
// tieBreak "none" means the world takes every tie; dex "return" is the old Slip; mustStatus false lets statuses be held.
const RULES_DEFAULTS = { tieBreak: "suit+trump", mustStatus: true, dex: "wait" };

function runCheck(rawSpec) {
  const spec = { ...RULES_DEFAULTS, ...rawSpec };
  const N = spec.tricks;
  const players = spec.players.map((ps) => {
    const deck = shuffle(ps.deck());
    return { ...ps, deck, hand: deck.splice(0, N + (spec.extraDraw || 0)), discard: [], tally: 0, brace: 0, mirror: false, wins: 0, stress: 0, stumblePrice: 0,
      forcedWins: 0, forcedOver: 0, outbid: 0, tied: 0, blocked: 0,
      wait: false, pull: false, feint: false, dexUses: 0, dexPays: 0 };
  });
  const row = worldRow(N);
  let worldTakes = 0, nextMod = 0;
  row.forEach((w, k) => {
    const last = k === N - 1;
    const wb = Math.max(0, w.v + nextMod); // the world card's value for beating this trick
    nextMod = 0;
    const plays = [];
    const order = [...players.filter((p) => !p.wait), ...players.filter((p) => p.wait)];
    const revealed = []; // what Waiting players see: everyone who did not Wait
    for (const p of order) {
      if (!p.hand.length) { p.wait = false; continue; }
      // Variant: a status in the world card's suit must be played.
      const owed = spec.mustStatus ? p.hand.find((c) => c.st && c.s === w.s) : null;
      const o = owed ? { c: owed, bv: owed.v + p.brace, want: false, forcedStatus: true }
        : p.wait ? chooseSeen(p, w, revealed, wb, spec) : choose(p, w, players, spec.hidden, wb, spec);
      const waited = p.wait, pulling = p.pull, feinting = p.feint;
      p.wait = false; p.pull = false; p.feint = false;
      if (owed) p.forcedStatus = (p.forcedStatus || 0) + 1;
      p.hand.splice(p.hand.indexOf(o.c), 1);
      const mirrored = p.mirror;
      p.brace = 0; p.mirror = false;
      if (o.c.st && o.c.s === "D" && spec.stumble === "trip") nextMod += 2; // Stumble variant: the next world card is harder
      else if (o.c.st && o.c.s === "D" && spec.stumble !== "none") { // Stumble's Price: discard an ordinary card (the bot drops its lowest)
        const ords = p.hand.filter((c) => !c.st).sort((a, b) => a.v - b.v);
        if (ords.length) { p.hand.splice(p.hand.indexOf(ords[0]), 1); p.discard.push(ords[0]); p.stumblePrice++; }
      }
      const play = { p, c: o.c, bv: o.bv, mirrored, want: o.want, forced: o.forced, waited, pulling, feint: feinting };
      plays.push(play);
      if (!waited) revealed.push(play);
    }
    const top = Math.max(wb, ...plays.map((x) => x.bv));
    const atTop = plays.filter((x) => x.bv === top);
    const onSuit = (x) => x.c.s === x.p.trump || x.c.s === w.s || x.feint;
    // Classify ties between players at the top, for the suit tie-break discussion.
    if (spec.tieStats && top > wb && atTop.length > 1) {
      const t = spec.tieStats; t.tricks++;
      const m = atTop.filter((x) => x.c.s === w.s).length;
      if (!atTop.every(onSuit)) t.offSuit++;
      else if (m === 1) t.oneMatches++;
      else if (m === 0) t.neither++;
      else t.both++;
      if (atTop.length > 2) t.threeWay++;
      if (atTop.every(onSuit)) {
        const sc = atTop.map((x) => (x.c.s === w.s ? 2 : 0) + (x.c.s === x.p.trump ? 1 : 0));
        if (sc.filter((v) => v === Math.max(...sc)).length === 1) t.suitTrumpResolves++;
      }
    }
    let win = top > wb && atTop.length === 1 && onSuit(atTop[0]) ? atTop[0] : null;
    // Variant: a tie between players goes to the one furthest from their target, if that is unique.
    if (!win && spec.tieBreak === "need" && top > wb && atTop.length > 1 && atTop.every(onSuit)) {
      const needs = atTop.map((x) => x.p.target - x.p.tally); const most = Math.max(...needs);
      if (needs.filter((n) => n === most).length === 1) win = atTop[needs.indexOf(most)];
    }
    // Variants: a tie between players goes to the lowest or highest tally, if that is unique.
    if (!win && (spec.tieBreak === "low" || spec.tieBreak === "high" || spec.tieBreak === "suit+low") && top > wb && atTop.length > 1 && atTop.every(onSuit)) {
      let pool = atTop;
      if (spec.tieBreak === "suit+low") { const m = atTop.filter((x) => x.c.s === w.s); if (m.length === 1) pool = m; }
      const t = pool.map((x) => x.p.tally); const pick = spec.tieBreak === "high" ? Math.max(...t) : Math.min(...t);
      if (t.filter((v) => v === pick).length === 1) win = pool[t.indexOf(pick)];
    }
    // Variant: rank tied cards by what they match: world suit and own trump > world suit only > own trump only.
    if (!win && spec.tieBreak === "suit+trump" && top > wb && atTop.length > 1 && atTop.every(onSuit)) {
      const score = (x) => (x.c.s === w.s || x.feint ? 2 : 0) + (x.c.s === x.p.trump ? 1 : 0);
      const sc = atTop.map(score); const best = Math.max(...sc);
      if (sc.filter((v) => v === best).length === 1) win = atTop[sc.indexOf(best)];
    }
    // Variant: a tie between players goes to the only tied card in the world card's suit.
    if (!win && spec.tieBreak === "suit" && top > wb && atTop.length > 1 && atTop.every(onSuit)) {
      const matching = atTop.filter((x) => x.c.s === w.s);
      if (matching.length === 1) win = matching[0];
    }
    // Stumble variant: if nobody wins, a lone played Stumble stumbles into the world card and takes it.
    if (!win && spec.stumble === "grab") {
      const st = plays.filter((x) => x.c.st && x.c.s === "D");
      if (st.length === 1) { win = st[0]; win.p.stumbleTakes = (win.p.stumbleTakes || 0) + 1; }
    }
    // Pull: a winner may refuse the world card; the bot refuses one that would bust it.
    if (win && win.pulling && win.p.tally + (win.mirrored ? 11 - w.v : w.v) > win.p.target) {
      win.p.dexPays++; win = null;
    }
    if (win) {
      if (win.waited || win.feint) win.p.dexPays++;
      win.p.tally += win.mirrored ? 11 - w.v : w.v; win.p.wins++;
      if (!win.want) { win.p.forcedWins++; if (win.p.tally > win.p.target) win.p.forcedOver++; }
    } else worldTakes++;
    // Accidents of hidden, silent play: a player who went for the world card and did not get it.
    for (const x of plays) {
      if (!x.want || x === win) continue;
      if (atTop.length > 1 && atTop.includes(x)) x.p.tied++;
      else if (win) x.p.outbid++;
      else x.p.blocked++;
    }
    for (const x of plays) {
      if (x === win || last) { x.p.discard.push(x.c); continue; }
      const p = x.p;
      if (x.c.s === "S") { p.brace = x.c.v; p.discard.push(x.c); }
      else if (x.c.s === "D") { // Dexterity: Wait (adopted), or a candidate under test
        p.dexUses++;
        const keep = spec.dex === "return" || (spec.dex === "return-noloop" && !x.c.st) || (spec.dex === "duck" && !x.c.st && x.c.v < w.v);
        if (keep) p.hand.push(x.c); else p.discard.push(x.c);
        if (spec.dex === "wait") p.wait = true;
        if (spec.dex === "pull") p.pull = true;
        if (spec.dex === "feint") p.feint = true;
      }
      else if (x.c.s === "W") { p.mirror = true; p.discard.push(x.c); }
      else { // Recalculate: drop a status if held, else the lowest card; draw one
        p.discard.push(x.c);
        if (p.hand.length && p.deck.length) {
          const i = p.hand.findIndex((c) => c.st);
          const drop = i >= 0 ? i : p.hand.indexOf([...p.hand].sort((a, b) => a.v - b.v)[0]);
          p.discard.push(...p.hand.splice(drop, 1));
          const drawn = p.deck.shift(); p.hand.push(drawn);
          if (drawn.st && drawn.s === "I") p.stress++;
        }
      }
    }
  });
  return { players, worldTakes };
}

function situation(name, spec, note) {
  if (ONLY && !ONLY.test(name)) return null;
  const stats = spec.players.map(() => ({ critical: 0, success: 0, partial: 0, failure: 0, bust: 0, tally: 0, wins: 0, stumblePrice: 0,
    forcedWins: 0, forcedOver: 0, outbid: 0, tied: 0, blocked: 0, anyMiss: 0, dexUses: 0, dexPays: 0 }));
  let worldTakes = 0, opposed = { a: 0, b: 0, stalemate: 0 };
  for (let t = 0; t < TRIALS; t++) {
    const r = runCheck(spec);
    worldTakes += r.worldTakes;
    r.players.forEach((p, i) => {
      const s = stats[i]; s[result(p.tally, p.target)]++; s.tally += p.tally; s.wins += p.wins; s.stumblePrice += p.stumblePrice;
      for (const k of ["forcedWins", "forcedOver", "outbid", "tied", "blocked", "dexUses", "dexPays"]) s[k] += p[k];
      s.forcedStatus = (s.forcedStatus || 0) + (p.forcedStatus || 0);
      if (p.forcedWins || p.outbid || p.tied || p.blocked) s.anyMiss++;
    });
    if (spec.opposed) {
      const [a, b] = r.players; const ra = RANK[result(a.tally, a.target)], rb = RANK[result(b.tally, b.target)];
      const da = Math.abs(a.target - a.tally), db = Math.abs(b.target - b.tally);
      if (ra > rb || (ra === rb && da < db)) opposed.a++; else if (rb > ra || (ra === rb && db < da)) opposed.b++; else opposed.stalemate++;
    }
  }
  const pct = (x) => `${Math.round((100 * x) / TRIALS)}%`;
  const out = {
    name, note, tricks: spec.tricks, worldTakes: Math.round((100 * worldTakes) / (TRIALS * spec.tricks)),
    players: spec.players.map((ps, i) => ({
      label: ps.label, target: ps.target,
      critical: pct(stats[i].critical), success: pct(stats[i].success), partial: pct(stats[i].partial),
      failure: pct(stats[i].failure), bust: pct(stats[i].bust),
      avgTally: (stats[i].tally / TRIALS).toFixed(1), wins: (stats[i].wins / TRIALS).toFixed(1),
      stumblePrice: (stats[i].stumblePrice / TRIALS).toFixed(2),
      forcedStatusPlays: ((stats[i].forcedStatus || 0) / TRIALS).toFixed(2),
      dexUsesPerCheck: (stats[i].dexUses / TRIALS).toFixed(2), dexPayoffsPerCheck: (stats[i].dexPays / TRIALS).toFixed(2),
      accidents: {
        forcedWinsPerCheck: (stats[i].forcedWins / TRIALS).toFixed(2), forcedWinBusts: pct(stats[i].forcedOver),
        outbidByAllyPerCheck: (stats[i].outbid / TRIALS).toFixed(2), tiedAwayPerCheck: (stats[i].tied / TRIALS).toFixed(2),
        blockedByAllyPerCheck: (stats[i].blocked / TRIALS).toFixed(2), checksWithAnAccident: pct(stats[i].anyMiss)
      }
    }))
  };
  if (spec.opposed) out.opposed = { first: pct(opposed.a), second: pct(opposed.b), stalemate: pct(opposed.stalemate) };
  if (spec.tieStats) out.ties = Object.fromEntries(Object.entries(spec.tieStats).map(([k, v]) => [k, (v / TRIALS).toFixed(2)]));
  return out;
}

const P = (label, trump, secondary, target, extra = {}) => ({
  label, trump, target, policy: extra.policy || "grab",
  deck: extra.deck || (() => [...starterDeck(trump, secondary), ...(extra.statuses || []).map(status)])
});
const three = (target, extra = {}) => [P("Ana (Strength)", "S", "D", target, extra), P("Ben (Dexterity)", "D", "I", target, extra), P("Cara (Intelligence)", "I", "W", target, extra)];

const NAME = { S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" };
const party = (extra = {}) => ["S", "D", "I", "W"].map((t, i) => P(`P${i + 1} (${NAME[t]})`, t, SUITS[(i + 1) % 4], 10, extra));
const mixed = () => [P("Ana: hold the door (easy)", "S", "D", 6), P("Ben: lift the keys (moderate)", "D", "I", 10), P("Cara: talk down the sheriff (very hard)", "I", "W", 16)];
const TIES = () => ({ tricks: 0, oneMatches: 0, neither: 0, both: 0, offSuit: 0, threeWay: 0, suitTrumpResolves: 0 });
const WORN = ["S", "D", "I"];
const HEAVY = ["S", "S", "D", "I", "W"];

// Every situation runs under the adopted rules unless it says otherwise (see RULES_DEFAULTS).
const situations = [
  // Part 1: table situations.
  situation("1. Default scene", { tricks: 10, tieStats: TIES(), players: three(10) },
    "3 players, fresh starter decks, standard check, everyone at the default target of 10."),
  situation("2. The same scene, yielding to allies", { tricks: 10, players: three(10, { policy: "yield" }) },
    "As 1, but each bot skips a world card that would land an ally exactly, unless it lands them exactly too."),
  situation("3. Mixed stakes", { tricks: 10, players: mixed() },
    "Per-player targets in one check: 6, 10 and 16."),
  situation("4. A worn-down party", { tricks: 13, players: party({ statuses: WORN }) },
    "4 players, each starter deck carrying an Injury, a Stumble and a Stress, target 10."),
  situation("5. A clean party of four", { tricks: 13, tieStats: TIES(), players: party() },
    "Scene 4 without statuses, for comparison."),
  situation("6. Survival at two Injuries", { tricks: 10, players: [P("Ana: survive (2 Injuries, target 6)", "S", "D", 6, { statuses: ["S", "S"] }), P("Ben", "D", "I", 10), P("Cara", "I", "W", 10)] },
    "Ana's scan found 2 Injuries: survival is her forced goal at target 6. A bust or 7+ short is death."),
  situation("7. Survival at three Injuries", { tricks: 10, players: [P("Ana: survive (3 Injuries, target 9)", "S", "D", 9, { statuses: ["S", "S", "S"] }), P("Ben", "D", "I", 10), P("Cara", "I", "W", 10)] },
    "As 6 with 3 Injuries: target 9."),
  situation("8. Two players", { tricks: 7, tieStats: TIES(), players: [P("Ana (Strength)", "S", "D", 10), P("Ben (Dexterity)", "D", "I", 10)] },
    "A standard 2-player check: 7 tricks, target 10."),
  situation("9. Quick check, three players", { tricks: 7, players: three(6) },
    "2 tricks per player + 1, target 6."),
  situation("10. Solo", { tricks: 6, players: [P("Ana alone (Strength)", "S", "D", 6)] },
    "One player, 6 tricks, target 6."),
  situation("11. Opposed goals", { tricks: 7, opposed: true, players: [P("Ana: keep the gate shut", "S", "D", 10), P("Ben: get the gate open", "D", "I", 10)] },
    "Two players with incompatible goals in a 2-player check, both at target 10. The better result wins, then the closer tally."),
  situation("12. Late campaign", { tricks: 10, players: [0, 1, 2].map((i) => ({ label: `Evolved deck ${i + 1}`, trump: SUITS[i], target: 10, policy: "grab", deck: evolvedDeck })) },
    "3 players whose decks have drifted far from the starter: 21 random cards from A–10."),
  situation("13. Hidden world value", { tricks: 10, hidden: true, players: three(10) },
    "As 1, but each world card's value stays hidden until everyone reveals; players see only how many tricks remain."),

  // Part 2: tie-breaks between players.
  ...[["none", "world takes"], ["suit", "world card's suit"], ["suit+trump", "suit, then trump"], ["need", "neediest"], ["low", "lowest tally"], ["high", "highest tally"]].flatMap(([tieBreak, label]) => [
    situation(`Ties ${label}: 3 players`, { tricks: 10, tieBreak, players: three(10) }, "Tie-break experiment."),
    situation(`Ties ${label}: 4 players`, { tricks: 13, tieBreak, players: party() }, "Tie-break experiment."),
    situation(`Ties ${label}: mixed stakes`, { tricks: 10, tieBreak, players: mixed() }, "Tie-break experiment."),
  ]),

  // Part 3: Dexterity's consolation. Outside "return", a losing Stumble takes the consolation and goes to discard: no loop.
  ...(() => {
    const scenes = [
      ["3 players", 10, () => three(10)],
      ["4 players", 13, () => party()],
      ["worn party", 13, () => party({ statuses: WORN })],
      ["mixed stakes", 10, () => [P("Ana (6)", "S", "D", 6), P("Ben (10)", "D", "I", 10), P("Cara (16)", "I", "W", 16)]],
      ["2 players", 7, () => [P("Ana (Strength)", "S", "D", 10), P("Ben (Dexterity)", "D", "I", 10)]],
      ["quick 3 players", 7, () => three(6)],
    ];
    const out = [];
    for (const dex of ["return", "return-noloop", "none", "wait", "duck", "pull", "feint"]) for (const [scene, tricks, players] of scenes) {
      out.push(situation(`Dex ${dex}: ${scene}`, { tricks, dex, players: players() }, "Dexterity consolation experiment."));
    }
    // Without Slip's return, hands have no slack; test drawing extra cards at the start to restore it.
    for (const dex of ["none", "wait", "duck"]) for (const extraDraw of [1, 2]) for (const [scene, tricks, players] of scenes) {
      out.push(situation(`Dex ${dex}+${extraDraw}: ${scene}`, { tricks, dex, extraDraw, players: players() }, "Dexterity consolation experiment, extra starting cards."));
    }
    return out;
  })(),

  // Part 4: statuses. Forced play on and off; Stumble's own rule.
  ...[["clean", []], ["worn", WORN], ["heavily worn", HEAVY]].flatMap(([name, statuses]) => [false, true].map((mustStatus) =>
    situation(`Statuses ${name}${mustStatus ? ", forced" : ", not forced"}`, { tricks: 13, mustStatus, players: party({ statuses }) }, "Forced-status experiment."))),
  ...["price", "trip", "grab", "none"].map((stumble) =>
    situation(`Stumble ${stumble}: worn party`, { tricks: 13, stumble, players: party({ statuses: WORN }) }, "Stumble experiment.")),

  // Part 5: survival targets, with the old Slip for comparison.
  ...[["3M", (m) => 3 * m, "wait"], ["4M", (m) => 4 * m, "wait"], ["4M − 2", (m) => 4 * m - 2, "wait"], ["4M, old Slip", (m) => 4 * m, "return"]].flatMap(([rule, target, dex]) =>
    [2, 3, 4, 5, 6].map((m) => situation(`Survival ${rule}: ${m} Injuries, target ${target(m)}`, { tricks: 10, dex, players: [P(`Survivor (${m} Injuries)`, "S", "D", target(m), { statuses: Array(m).fill("S") }), P("Ally", "D", "I", 10), P("Ally", "I", "W", 10)] },
      `Death on a bust or 7+ short. Rule ${rule}, target ${target(m)}.`))),
];

console.log(JSON.stringify({ trials: TRIALS, situations: situations.filter(Boolean) }, null, 2));
