// Monte Carlo simulation of Tally checks (RULES.md) for concrete table situations.
// Usage: node scripts/simulate_tally.mjs [trials]   (default 20000 per situation)
// Bots are simple and do not read each other, so treat results as relative, not as table odds.
const TRIALS = Number(process.argv[2]) || 20000;
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
const PASS_ORDER = (c) => (c.st && c.s === "D" ? 6 : c.s === "D" ? 0 : c.st ? 1 : c.s === "W" ? 2 : c.s === "S" ? 3 : 4);

function choose(p, w, table, hidden, wb = w.v) {
  const need = p.target - p.tally;
  const wv = hidden ? 5.5 : wb; // the value to beat; with a hidden world value, bots guess the average
  const pv = hidden ? 5.5 : w.v; // the value it scores
  const prize = p.mirror ? 11 - pv : pv;
  const opts = p.hand.map((c) => {
    const bv = c.v + p.brace;
    const on = c.s === p.trump || c.s === w.s;
    return { c, bv, beats: on && bv > wv };
  });
  const beaters = opts.filter((o) => o.beats).sort((a, b) => a.bv - b.bv);
  let want = beaters.length && prize <= need;
  // Cooperative bots yield a world card that lands an ally exactly, unless it lands them exactly too.
  if (want && p.policy === "yield" && !hidden && prize !== need) {
    if (table.some((q) => q !== p && q.target - q.tally === w.v)) want = false;
  }
  if (want) return { ...beaters[beaters.length > 1 && beaters[0].bv - wv < 2 ? 1 : 0], want: true };
  const losers = opts.filter((o) => !o.beats).sort((a, b) => PASS_ORDER(a.c) - PASS_ORDER(b.c) || a.c.v - b.c.v);
  if (losers.length) return { ...losers[0], want: false };
  return { ...beaters[0], want: false, forced: true }; // every card in hand would win
}

function runCheck(spec) {
  const N = spec.tricks;
  const players = spec.players.map((ps) => {
    const deck = shuffle(ps.deck());
    return { ...ps, deck, hand: deck.splice(0, N), discard: [], tally: 0, brace: 0, mirror: false, wins: 0, stress: 0, stumblePrice: 0,
      forcedWins: 0, forcedOver: 0, outbid: 0, tied: 0, blocked: 0 };
  });
  const row = worldRow(N);
  let worldTakes = 0, nextMod = 0;
  row.forEach((w, k) => {
    const last = k === N - 1;
    const wb = Math.max(0, w.v + nextMod); // the world card's value for beating this trick
    nextMod = 0;
    const plays = [];
    for (const p of players) {
      if (!p.hand.length) continue;
      // Variant: a status in the world card's suit must be played.
      const owed = spec.mustStatus ? p.hand.find((c) => c.st && c.s === w.s) : null;
      const o = owed ? { c: owed, bv: owed.v + p.brace, want: false, forcedStatus: true } : choose(p, w, players, spec.hidden, wb);
      if (owed) p.forcedStatus = (p.forcedStatus || 0) + 1;
      p.hand.splice(p.hand.indexOf(o.c), 1);
      const mirrored = p.mirror;
      p.brace = 0; p.mirror = false;
      if (o.c.st && o.c.s === "D" && spec.stumble === "trip") nextMod += 2; // Stumble variant: the next world card is harder
      else if (o.c.st && o.c.s === "D" && spec.stumble !== "none") { // Stumble's Price: discard an ordinary card (the bot drops its lowest)
        const ords = p.hand.filter((c) => !c.st).sort((a, b) => a.v - b.v);
        if (ords.length) { p.hand.splice(p.hand.indexOf(ords[0]), 1); p.discard.push(ords[0]); p.stumblePrice++; }
      }
      plays.push({ p, c: o.c, bv: o.bv, mirrored, want: o.want, forced: o.forced });
    }
    const top = Math.max(wb, ...plays.map((x) => x.bv));
    const atTop = plays.filter((x) => x.bv === top);
    const onSuit = (x) => x.c.s === x.p.trump || x.c.s === w.s;
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
      const score = (x) => (x.c.s === w.s ? 2 : 0) + (x.c.s === x.p.trump ? 1 : 0);
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
    if (win) {
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
    let dexLosers = 0;
    for (const x of plays) {
      if (x === win || last) { x.p.discard.push(x.c); continue; }
      const p = x.p;
      if (x.c.s === "S") { p.brace = x.c.v; p.discard.push(x.c); }
      else if (x.c.s === "D") {
        if (spec.slipMode === "notrump" && x.c.s === p.trump && !x.c.st) p.discard.push(x.c); // variant: your own trump does not slip
        else if (spec.slipMode === "once" && p.slipped) p.discard.push(x.c); // variant: one Slip per check
        else if (!spec.slip) { p.hand.push(x.c); p.slipped = true; } // Slip: return it to hand
        else { // Slip variants: the next world card counts lower for beating, for everyone
          if (spec.slipReturn) p.hand.push(x.c); else p.discard.push(x.c);
          if (!(x.c.st && spec.stumble === "trip")) dexLosers++;
        }
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
    if (spec.slip) {
      const [, n, once] = spec.slip.match(/^w(\d)(once)?$/);
      nextMod -= once ? (dexLosers ? Number(n) : 0) : Number(n) * dexLosers;
    }
  });
  return { players, worldTakes };
}

function situation(name, spec, note) {
  const stats = spec.players.map(() => ({ critical: 0, success: 0, partial: 0, failure: 0, bust: 0, tally: 0, wins: 0, stumblePrice: 0,
    forcedWins: 0, forcedOver: 0, outbid: 0, tied: 0, blocked: 0, anyMiss: 0 }));
  let worldTakes = 0, opposed = { a: 0, b: 0, stalemate: 0 };
  for (let t = 0; t < TRIALS; t++) {
    const r = runCheck(spec);
    worldTakes += r.worldTakes;
    r.players.forEach((p, i) => {
      const s = stats[i]; s[result(p.tally, p.target)]++; s.tally += p.tally; s.wins += p.wins; s.stumblePrice += p.stumblePrice;
      for (const k of ["forcedWins", "forcedOver", "outbid", "tied", "blocked"]) s[k] += p[k];
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

const situations = [
  situation("1. Default scene", { tricks: 10, players: three(10) },
    "3 players, fresh starter decks, standard check, everyone at the default target of 10."),
  situation("2. The same scene, yielding to allies", { tricks: 10, players: three(10, { policy: "yield" }) },
    "As 1, but each bot skips a world card that would land an ally exactly, unless it lands them exactly too."),
  situation("3. Mixed stakes", { tricks: 10, players: [P("Ana: hold the door (easy)", "S", "D", 6), P("Ben: lift the keys (moderate)", "D", "I", 10), P("Cara: talk down the sheriff (very hard)", "I", "W", 16)] },
    "Per-player targets in one check: 6, 10 and 16."),
  situation("4. A worn-down party", { tricks: 13, players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10, { statuses: ["S", "D", "I"] })) },
    "4 players, each starter deck carrying an Injury, a Stumble and a Stress, target 10."),
  situation("5. A clean party of four", { tricks: 13, players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10)) },
    "Scene 4 without statuses, for comparison."),
  situation("6. Survival at two Injuries", { tricks: 10, players: [P("Ana: survive (2 Injuries, target 4)", "S", "D", 4, { statuses: ["S", "S"] }), P("Ben", "D", "I", 10), P("Cara", "I", "W", 10)] },
    "Ana's scan found 2 Injuries: survival is her forced goal at target 4. A bust or 7+ short is death."),
  situation("7. Survival at three Injuries", { tricks: 10, players: [P("Ana: survive (3 Injuries, target 6)", "S", "D", 6, { statuses: ["S", "S", "S"] }), P("Ben", "D", "I", 10), P("Cara", "I", "W", 10)] },
    "As 6 with 3 Injuries: target 6."),
  situation("8. Two players", { tricks: 7, tieStats: { tricks: 0, oneMatches: 0, neither: 0, both: 0, offSuit: 0, threeWay: 0, suitTrumpResolves: 0 }, players: [P("Ana (Strength)", "S", "D", 10), P("Ben (Dexterity)", "D", "I", 10)] },
    "A standard 2-player check: 7 tricks, target 10."),
  situation("9. Quick check, three players", { tricks: 7, players: three(5) },
    "2 tricks per player + 1, target 5."),
  situation("10. Solo", { tricks: 6, players: [P("Ana alone (Strength)", "S", "D", 6)] },
    "One player, 6 tricks, target 6."),
  situation("11. Opposed goals", { tricks: 7, opposed: true, players: [P("Ana: keep the gate shut", "S", "D", 10), P("Ben: get the gate open", "D", "I", 10)] },
    "Two players with incompatible goals in a 2-player check, both at target 10. The better result wins, then the closer tally."),
  situation("12. Late campaign", { tricks: 10, players: [0, 1, 2].map((i) => ({ label: `Evolved deck ${i + 1}`, trump: SUITS[i], target: 10, policy: "grab", deck: evolvedDeck })) },
    "3 players whose decks have drifted far from the starter: 21 random cards from A–10."),
  situation("1b. Default scene, ties to the neediest", { tricks: 10, tieBreak: "need", players: three(10) },
    "As 1, but a tie between players goes to whoever is furthest from their target."),
  situation("5b. Party of four, ties to the neediest", { tricks: 13, tieBreak: "need", players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10)) },
    "As 5, with the same tie-break."),
  situation("1c. Default scene, ties to the world card's suit", { tricks: 10, tieBreak: "suit", tieStats: { tricks: 0, oneMatches: 0, neither: 0, both: 0, offSuit: 0, threeWay: 0, suitTrumpResolves: 0 }, players: three(10) },
    "As 1, but a tie between players goes to the only tied card in the world card's suit."),
  situation("5c. Party of four, ties to the world card's suit", { tricks: 13, tieBreak: "suit", tieStats: { tricks: 0, oneMatches: 0, neither: 0, both: 0, offSuit: 0, threeWay: 0, suitTrumpResolves: 0 }, players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10)) },
    "As 5, with the same tie-break."),
  situation("1-low. Default scene, ties to the lowest tally", { tricks: 10, tieBreak: "low", players: three(10) }, "Tie-break variant."),
  situation("5-low. Party of four, ties to the lowest tally", { tricks: 13, tieBreak: "low", players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10)) }, "Tie-break variant."),
  situation("3-low. Mixed stakes, ties to the lowest tally", { tricks: 10, tieBreak: "low", players: [P("Ana: hold the door (easy)", "S", "D", 6), P("Ben: lift the keys (moderate)", "D", "I", 10), P("Cara: talk down the sheriff (very hard)", "I", "W", 16)] }, "Tie-break variant."),
  situation("1-high. Default scene, ties to the highest tally", { tricks: 10, tieBreak: "high", players: three(10) }, "Tie-break variant."),
  situation("5-high. Party of four, ties to the highest tally", { tricks: 13, tieBreak: "high", players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10)) }, "Tie-break variant."),
  situation("3-high. Mixed stakes, ties to the highest tally", { tricks: 10, tieBreak: "high", players: [P("Ana: hold the door (easy)", "S", "D", 6), P("Ben: lift the keys (moderate)", "D", "I", 10), P("Cara: talk down the sheriff (very hard)", "I", "W", 16)] }, "Tie-break variant."),
  situation("1-suit+low. Default scene, ties to the world card's suit, then lowest tally", { tricks: 10, tieBreak: "suit+low", players: three(10) }, "Tie-break variant."),
  situation("5-suit+low. Party of four, ties to the world card's suit, then lowest tally", { tricks: 13, tieBreak: "suit+low", players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10)) }, "Tie-break variant."),
  situation("3-suit+low. Mixed stakes, ties to the world card's suit, then lowest tally", { tricks: 10, tieBreak: "suit+low", players: [P("Ana: hold the door (easy)", "S", "D", 6), P("Ben: lift the keys (moderate)", "D", "I", 10), P("Cara: talk down the sheriff (very hard)", "I", "W", 16)] }, "Tie-break variant."),
  situation("3-need. Mixed stakes, ties to the neediest", { tricks: 10, tieBreak: "need", players: [P("Ana: hold the door (easy)", "S", "D", 6), P("Ben: lift the keys (moderate)", "D", "I", 10), P("Cara: talk down the sheriff (very hard)", "I", "W", 16)] }, "Tie-break variant."),
  situation("3-suit. Mixed stakes, ties to the world card's suit", { tricks: 10, tieBreak: "suit", tieStats: { tricks: 0, oneMatches: 0, neither: 0, both: 0, offSuit: 0, threeWay: 0, suitTrumpResolves: 0 }, players: [P("Ana: hold the door (easy)", "S", "D", 6), P("Ben: lift the keys (moderate)", "D", "I", 10), P("Cara: talk down the sheriff (very hard)", "I", "W", 16)] }, "Tie-break variant."),
  situation("1-suit+trump. Default scene, ties by suit then trump", { tricks: 10, tieBreak: "suit+trump", players: three(10) }, "Tie-break variant."),
  situation("5-suit+trump. Party of four, ties by suit then trump", { tricks: 13, tieBreak: "suit+trump", players: ["S", "D", "I", "W"].map((t, i) => P(`Player ${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10)) }, "Tie-break variant."),
  ...(() => {
    const party = (extra = {}) => ["S", "D", "I", "W"].map((t, i) => P(`P${i + 1} (${{ S: "Strength", D: "Dexterity", I: "Intelligence", W: "Weird" }[t]})`, t, SUITS[(i + 1) % 4], 10, extra));
    const out = [];
    out.push(situation("Slip none (Dexterity gives nothing): 3 players", { tricks: 10, tieBreak: "suit+trump", slip: "w0", players: three(10) }, "Slip experiment."));
    out.push(situation("Slip return, but not your own trump: 3 players", { tricks: 10, tieBreak: "suit+trump", slipMode: "notrump", players: three(10) }, "Slip experiment."));
    out.push(situation("Slip return, once per check: 3 players", { tricks: 10, tieBreak: "suit+trump", slipMode: "once", players: three(10) }, "Slip experiment."));
    out.push(situation("Slip return and −1: 3 players", { tricks: 10, tieBreak: "suit+trump", slip: "w1", slipReturn: true, players: three(10) }, "Slip experiment."));
    for (const slip of [undefined, "w1", "w1once", "w2", "w2once"]) {
      const label = slip ? slip.replace("w", "−").replace("once", " (no stacking)") : "return to hand (current)";
      out.push(situation(`Slip ${label}: 3 players`, { tricks: 10, tieBreak: "suit+trump", slip, players: three(10) }, "Slip experiment."));
      out.push(situation(`Slip ${label}: 4 players`, { tricks: 13, tieBreak: "suit+trump", slip, players: party() }, "Slip experiment."));
    }
    const heavy = ["S", "S", "D", "I", "W"];
    for (const [name, statuses] of [["clean", []], ["worn (Injury, Stumble, Stress)", ["S", "D", "I"]], ["heavily worn (2 Injuries, Stumble, Stress, Curse)", heavy]]) {
      for (const mustStatus of [false, true]) {
        out.push(situation(`Statuses ${name}${mustStatus ? ", must play matching status" : ""}`, { tricks: 13, tieBreak: "suit+trump", mustStatus, players: party({ statuses }) }, "Forced-status experiment."));
      }
    }
    for (const slip of [undefined, "w1", "w2once"]) for (const stumble of ["price", "trip", "grab", "none"]) {
      out.push(situation(`Stumble ${stumble}, slip ${slip || "return"}: worn party`, { tricks: 13, tieBreak: "suit+trump", slip, stumble, players: party({ statuses: ["S", "D", "I"] }) }, "Stumble experiment."));
    }
    return out;
  })(),
  situation("13. Hidden world value", { tricks: 10, hidden: true, players: three(10) },
    "As 1, but each world card's value stays hidden until everyone reveals; players see only how many tricks remain."),
  ...[2, 3, 4].flatMap((m) => [2 * m, 2 * m + 4, 3 * m, 4 * m].map((target) => situation(`Survival rule: ${m} Injuries, target ${target}`, { tricks: 10, players: [P(`Survivor (${m} Injuries)`, "S", "D", target, { statuses: Array(m).fill("S") }), P("Ally", "D", "I", 10), P("Ally", "I", "W", 10)] },
    `Death on a bust or 7+ short. Target ${target}.`))),
];

console.log(JSON.stringify({ trials: TRIALS, situations }, null, 2));
