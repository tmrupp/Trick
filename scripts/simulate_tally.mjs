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

// Starter recipes: values in every suit, then added to the primary and the secondary suit.
const RECIPES = {
  "old 2-4-6-8": { every: [2, 4, 6, 8], primary: [1, 5, 9], secondary: [3, 7] },
  "1-4-7-10": { every: [1, 4, 7, 10], primary: [2, 5, 8], secondary: [3, 6] },
  "2-5-8-10": { every: [2, 5, 8, 10], primary: [1, 4, 7], secondary: [3, 6] },
  "3-5-7-9": { every: [3, 5, 7, 9], primary: [1, 2, 10], secondary: [4, 8] },
  "2-5-8 deep": { every: [2, 5, 8], primary: [1, 4, 7, 9, 10], secondary: [3, 6, 9, 10] },
  // Two of each value A–10 (20 cards). "others" lists the cards for the two remaining suits, one list each.
  "pairs, trump run": { every: [], primary: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], secondary: [3, 6, 9, 10], others: [[1, 4, 7], [2, 5, 8]] },
  "pairs, odds and evens": { every: [], primary: [1, 3, 5, 7, 9, 10], secondary: [2, 4, 6, 8, 10], others: [[1, 3, 5, 7, 9], [2, 4, 6, 8]] },
  "pairs, spread": { every: [], primary: [1, 2, 4, 5, 7, 8, 10], secondary: [1, 3, 6, 9, 10], others: [[2, 3, 6, 9], [4, 5, 7, 8]] },
  // 26 cards: A–10 of primary and secondary, plus A, 4, 7 and 2, 5, 8 in the other two suits.
  "26: two runs": { every: [], primary: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], secondary: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], others: [[1, 4, 7], [2, 5, 8]] },
  // 26 cards: A-4-7-10 in every suit, the rest of A–10 in the primary, and 2, 5, 8, 9 in the secondary.
  "26: A-4-7-10, primary run": { every: [1, 4, 7, 10], primary: [2, 3, 5, 6, 8, 9], secondary: [2, 5, 8, 9] },
};
// The adopted starter (RULES.md) is "pairs, spread": two of each value A–10.
function starterDeck(primary, secondary, recipe = "pairs, spread") {
  const r = RECIPES[recipe], d = [];
  for (const s of SUITS) for (const v of r.every) d.push(card(s, v));
  for (const v of r.primary) d.push(card(primary, v));
  for (const v of r.secondary) d.push(card(secondary, v));
  if (r.others) {
    const rest = SUITS.filter((s) => s !== primary && s !== secondary);
    r.others.forEach((vals, i) => { for (const v of vals) d.push(card(rest[i], v)); });
  }
  return d;
}
// A later-campaign deck: 21 random ordinary cards from two decks' A–10.
function evolvedDeck() {
  const pool = [];
  for (const s of SUITS) for (let v = 1; v <= 10; v++) pool.push(card(s, v), card(s, v));
  return shuffle(pool).slice(0, 21);
}
const worldDeck = () => { const d = []; for (const s of SUITS) for (let v = 1; v <= 10; v++) d.push(card(s, v)); return shuffle(d); };

// Dexterity candidates that change the world row instead of the player's next play.
const WORLD_DEX = new Set(["blind", "reroll", "reroll-each", "peek", "sidestep", "shove"]);
// How much a player wants this world card next: 3 lands them exactly, 2 fits, 0 is no use, -2 would force a win that busts them.
function worth(p, wc) {
  const need = p.target - p.tally;
  const prize = p.mirror ? 11 - wc.v : wc.v;
  const on = (c) => c.s === p.trump || c.s === wc.s;
  const beats = p.hand.filter((c) => on(c) && c.v + p.brace > wc.v);
  if (p.hand.length && beats.length === p.hand.length && prize > need) return -2;
  if (!beats.length || need <= 0 || prize > need) return 0;
  return prize === need ? 3 : 2;
}

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
  if (p.forceYield) want = false; // collision experiments: this player has stood aside
  if (want && spec.claims && w.claimedBy && w.claimedBy !== p) want = false; // claimed by an ally before drawing
  // Runoff information: a card an ally revealed in a runoff (and kept) is known. If it would take this world card
  // and the card still fits that ally, stand aside unless it lands you exactly.
  if (want && spec.runoffInfo && prize !== need) {
    const allyHasIt = table.some((q) => q !== p && q.hand.some((c) => c.revealed && (c.s === q.trump || c.s === w.s) && c.v + q.brace > w.v)
      && (q.mirror ? 11 - w.v : w.v) <= q.target - q.tally);
    if (allyHasIt) { want = false; p.deferred = (p.deferred || 0) + 1; }
  }
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

// The adopted rules (RULES.md): suit-then-trump ties, forced statuses, blind Peek. A spec overrides any of them:
// tieBreak "none" means the world takes every tie; dex "return" is the old Slip, "wait" the replaced Wait;
// mustStatus false lets statuses be held.
const RULES_DEFAULTS = { tieBreak: "suit+trump", mustStatus: true, dex: "blind" };

function runCheck(rawSpec) {
  const spec = { ...RULES_DEFAULTS, ...rawSpec };
  const N = spec.tricks;
  const players = spec.players.map((ps) => {
    const deck = shuffle(ps.deck());
    return { ...ps, deck, hand: deck.splice(0, N + (spec.extraDraw || 0)), discard: [], tally: 0, brace: 0, mirror: false, wins: 0, stress: 0, stumblePrice: 0,
      forcedWins: 0, forcedOver: 0, outbid: 0, tied: 0, blocked: 0,
      wait: false, pull: false, feint: false, dexUses: 0, dexPays: 0 };
  });
  const reserve = worldDeck();
  const row = reserve.splice(0, N);
  // Collision experiment: claim world cards in the row before drawing. Round-robin, each claims the unclaimed card
  // that best fills what it still needs, preferring its own trump suit and bigger cards.
  if (spec.claims) {
    const claimed = new Map(players.map((p) => [p, 0]));
    for (let progress = true; progress;) {
      progress = false;
      for (const p of players) {
        const room = p.target - claimed.get(p);
        let best = null, score = -1;
        for (const wc of row) {
          if (wc.claimedBy || wc.v > room) continue;
          const sc = wc.v + (wc.s === p.trump ? 5 : 0);
          if (sc > score) { best = wc; score = sc; }
        }
        if (best) { best.claimedBy = p; claimed.set(p, claimed.get(p) + best.v); progress = true; }
      }
    }
  }
  let worldTakes = 0, nextMod = 0;
  row.forEach((w, k) => {
    const last = k === N - 1;
    const wb = Math.max(0, w.v + nextMod); // the world card's value for beating this trick
    nextMod = 0;
    const plays = [];
    let order = [...players.filter((p) => !p.wait), ...players.filter((p) => p.wait)];
    const revealed = []; // what Waiting players see: everyone who did not Wait
    // Collision experiment: a point player, rotating each trick, reveals first; everyone else sees only that card.
    const pointP = spec.point ? players[k % players.length] : null;
    const tiePoint = spec.pointTies ? players[k % players.length] : null; // a rotating point player wins ties it is in
    const pointSeen = [];
    if (pointP) order = [pointP, ...order.filter((p) => p !== pointP)];
    // Collision experiments: before choosing, everyone signals at once. "call": in or out; in players stand aside
    // unless the card lands them exactly. "need": 0 out, 1 it helps, 2 it lands me exactly; lower signals stand aside.
    if (spec.signal) {
      const sig = new Map();
      for (const p of players) {
        if (!p.hand.length || p.wait) { sig.set(p, 0); continue; }
        const o = choose(p, w, players, spec.hidden, wb, spec);
        const exact = (p.mirror ? 11 - w.v : w.v) === p.target - p.tally;
        sig.set(p, o.want ? (exact ? 2 : 1) : 0);
      }
      const ins = players.filter((p) => sig.get(p) > 0);
      const max = Math.max(0, ...ins.map((p) => sig.get(p)));
      for (const p of ins) {
        if (spec.signal === "call") p.forceYield = ins.length > 1 && sig.get(p) < 2;
        else p.forceYield = sig.get(p) < max;
        if (p.forceYield) p.stoodAside = (p.stoodAside || 0) + 1;
      }
    }
    for (const p of order) {
      if (!p.hand.length) { p.wait = false; continue; }
      // Variant: a status in the world card's suit must be played.
      const owed = spec.mustStatus ? p.hand.find((c) => c.st && c.s === w.s) : null;
      const o = owed ? { c: owed, bv: owed.v + p.brace, want: false, forcedStatus: true }
        : p.wait ? chooseSeen(p, w, revealed, wb, spec)
        : pointP && p !== pointP ? chooseSeen(p, w, pointSeen, wb, spec)
        : choose(p, w, players, spec.hidden, wb, spec);
      p.forceYield = false;
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
      if (p === pointP) pointSeen.push(play);
    }
    const onSuit = (x) => x.c.s === x.p.trump || x.c.s === w.s || x.feint;
    // Collision experiment: off-suit cards don't block; only on-suit cards contend.
    const contenders = spec.blocks === false ? plays.filter(onSuit) : plays;
    const top = Math.max(wb, ...contenders.map((x) => x.bv));
    const atTop = contenders.filter((x) => x.bv === top);
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
    // Collision experiment, the runoff: contenders each reveal a card from hand; the higher value wins, equal values
    // leave it to the world. "ties": only players tied for the top card run off. "all": every on-suit card that beats
    // the world card contends, unless an off-suit card is highest (a block). runoffSpend: the revealed card is discarded.
    // Bots that want the world card reveal their highest card; bots that don't reveal their lowest.
    if (spec.runoff) {
      let field = [];
      if (spec.runoff === "ties" && top > wb && atTop.length > 1 && atTop.every(onSuit)) field = atTop;
      if (spec.runoff === "all" && top > wb && atTop.every(onSuit)) field = plays.filter((x) => onSuit(x) && x.bv > wb);
      if (field.length > 1) {
        const shown = field.map((x) => {
          const p = x.p, need = p.target - p.tally, prize = x.mirrored ? 11 - w.v : w.v;
          const pool = [...p.hand].sort((a, b) => a.v - b.v);
          const c = prize <= need ? pool[pool.length - 1] : pool[0];
          if (c && spec.runoffSpend) { p.hand.splice(p.hand.indexOf(c), 1); p.discard.push(c); }
          else if (c) c.revealed = true;
          return c ? c.v : -1;
        });
        const best = Math.max(...shown);
        let tops = field.filter((x, i) => shown[i] === best);
        // runoffFallback: equal reveals fall back to suit, then trump, on the cards played.
        if (tops.length > 1 && spec.runoffFallback) {
          const sc = tops.map((x) => (x.c.s === w.s ? 2 : 0) + (x.c.s === x.p.trump ? 1 : 0)); const m = Math.max(...sc);
          tops = tops.filter((x, i) => sc[i] === m);
        }
        win = tops.length === 1 ? tops[0] : null;
        for (const x of field) x.p.runoffs = (x.p.runoffs || 0) + 1;
      }
    }
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
    if (!win && tiePoint && top > wb && atTop.length > 1 && atTop.every(onSuit)) win = atTop.find((x) => x.p === tiePoint) || null;
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
    // Collision experiment: a runoff only for ties that suit, then trump leaves level (both or neither match).
    if (!win && spec.runoffAfter && top > wb && atTop.length > 1 && atTop.every(onSuit)) {
      const sc = atTop.map((x) => (x.c.s === w.s ? 2 : 0) + (x.c.s === x.p.trump ? 1 : 0)); const m = Math.max(...sc);
      const field = atTop.filter((x, i) => sc[i] === m);
      const shown = field.map((x) => {
        const p = x.p, pool = [...p.hand].sort((a, b) => a.v - b.v);
        const c = (x.mirrored ? 11 - w.v : w.v) <= p.target - p.tally ? pool[pool.length - 1] : pool[0];
        if (c) c.revealed = true;
        return c ? c.v : -1;
      });
      const best = Math.max(...shown);
      if (shown.filter((v) => v === best).length === 1) win = field[shown.indexOf(best)];
      for (const x of field) x.p.runoffs = (x.p.runoffs || 0) + 1;
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
    const movers = []; // losing Dexterity players who may change the world row
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
        if (WORLD_DEX.has(spec.dex)) movers.push(p);
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
    // World-row candidates, in seat order. Each acts on the row as the previous one left it.
    const nx = k + 1;
    if (movers.length && nx < N) {
      if (spec.dex === "blind") { // Peek, adopted: any losing Spade replaces the next world card, unseen, once
        if (reserve.length) { const t = row[nx]; row[nx] = reserve.shift(); reserve.push(t); movers[0].dexPays++; }
      } else if (spec.dex === "reroll") { // Reroll: if anyone asks, the next world card is discarded and replaced, once
        const asker = movers.find((p) => worth(p, row[nx]) <= 0);
        if (asker && reserve.length) { row[nx] = reserve.shift(); asker.dexPays++; }
      } else for (const p of movers) {
        const cur = worth(p, row[nx]);
        if (spec.dex === "reroll-each") { // each may discard and replace the next world card
          if (cur <= 0 && reserve.length) { row[nx] = reserve.shift(); p.dexPays++; }
        } else if (spec.dex === "peek") { // look at the world deck's top card; may swap it for the next world card
          if (reserve.length && worth(p, reserve[0]) > cur) { const t = row[nx]; row[nx] = reserve.shift(); reserve.push(t); p.dexPays++; }
        } else if (spec.dex === "sidestep") { // swap the next world card with any later one in the row
          let best = nx, bv = cur;
          for (let j = nx + 1; j < N; j++) { const v = worth(p, row[j]); if (v > bv) { best = j; bv = v; } }
          if (best !== nx) { [row[nx], row[best]] = [row[best], row[nx]]; p.dexPays++; }
        } else if (spec.dex === "shove") { // put the next world card at the end of the row
          if (cur <= 0 && nx < N - 1) { const [t] = row.splice(nx, 1); row.push(t); p.dexPays++; }
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
      s.stoodAside = (s.stoodAside || 0) + (p.stoodAside || 0);
      s.runoffs = (s.runoffs || 0) + (p.runoffs || 0);
      s.deferred = (s.deferred || 0) + (p.deferred || 0);
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
      stoodAsidePerCheck: ((stats[i].stoodAside || 0) / TRIALS).toFixed(2),
      runoffsPerCheck: ((stats[i].runoffs || 0) / TRIALS).toFixed(2),
      deferredPerCheck: ((stats[i].deferred || 0) / TRIALS).toFixed(2),
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
  deck: extra.deck || (() => [...starterDeck(trump, secondary, extra.recipe), ...(extra.statuses || []).map(status)])
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

  // Part 3b: Dexterity candidates that change the world row.
  ...(() => {
    const scenes = [
      ["3 players", 10, () => three(10)],
      ["4 players", 13, () => party()],
      ["worn party", 13, () => party({ statuses: WORN })],
      ["mixed stakes", 10, () => [P("Ana (6)", "S", "D", 6), P("Ben (10)", "D", "I", 10), P("Cara (16)", "I", "W", 16)]],
      ["2 players", 7, () => [P("Ana (Strength)", "S", "D", 10), P("Ben (Dexterity)", "D", "I", 10)]],
      ["quick 3 players", 7, () => three(6)],
      ["solo", 6, () => [P("Ana alone (Strength)", "S", "D", 6)]],
    ];
    const out = [];
    for (const dex of ["blind", "wait", "reroll", "reroll-each", "peek", "sidestep", "shove", "none"]) for (const [scene, tricks, players] of scenes) {
      out.push(situation(`World ${dex}: ${scene}`, { tricks, dex, players: players() }, "World-row Dexterity experiment."));
    }
    return out;
  })(),

  // Part 3c: rules that might reduce collisions between allies, under Peek.
  ...(() => {
    const scenes = [
      ["3 players", 10, () => three(10)],
      ["4 players", 13, () => party()],
      ["mixed stakes", 10, () => mixed()],
      ["2 players", 7, () => [P("Ana (Strength)", "S", "D", 10), P("Ben (Dexterity)", "D", "I", 10)]],
    ];
    const rules = [
      ["current", {}],
      ["no blocking", { blocks: false }],
      ["call in or out", { signal: "call" }],
      ["show need", { signal: "need" }],
      ["point reveals first", { point: true }],
      ["claim before drawing", { claims: true }],
      ["claim and show need", { claims: true, signal: "need" }],
      ["point wins ties", { pointTies: true }],
      ["runoff on ties, card kept", { runoff: "ties", tieBreak: "none" }],
      ["suit and trump, then runoff", { runoffAfter: true }],
      ["runoff on ties, kept, then suit and trump", { runoff: "ties", runoffFallback: true, tieBreak: "none" }],
      ["runoff among all beaters, kept, then suit and trump", { runoff: "all", runoffFallback: true, tieBreak: "none" }],
      ["runoff on ties, kept, then suit and trump, read", { runoff: "ties", runoffFallback: true, runoffInfo: true, tieBreak: "none" }],
      ["runoff among all beaters, kept, then suit and trump, read", { runoff: "all", runoffFallback: true, runoffInfo: true, tieBreak: "none" }],
      ["runoff on ties, card spent", { runoff: "ties", runoffSpend: true, tieBreak: "none" }],
      ["runoff among all beaters, card kept", { runoff: "all", tieBreak: "none" }],
      ["runoff among all beaters, card spent", { runoff: "all", runoffSpend: true, tieBreak: "none" }],
      ["point reveals first, no blocking", { point: true, blocks: false }],
    ];
    const out = [];
    for (const [rule, extra] of rules) for (const [scene, tricks, players] of scenes) {
      out.push(situation(`Collide ${rule}: ${scene}`, { tricks, ...extra, players: players() }, "Collision experiment."));
    }
    return out;
  })(),

  // Part 3d: starter recipes with a wider spread of values.
  ...Object.keys(RECIPES).flatMap((recipe) => [
    ["3 players", 10, () => three(10, { recipe }), true],
    ["opposed", 7, () => [P("Ana (Strength)", "S", "D", 10, { recipe }), P("Ben (Dexterity)", "D", "I", 10, { recipe })]],
    ["4 players", 13, () => party({ recipe })],
    ["worn party", 13, () => party({ recipe, statuses: WORN })],
    ["mixed stakes", 10, () => [P("Ana (6)", "S", "D", 6, { recipe }), P("Ben (10)", "D", "I", 10, { recipe }), P("Cara (16)", "I", "W", 16, { recipe })]],
    ["2 players", 7, () => [P("Ana (Strength)", "S", "D", 10, { recipe }), P("Ben (Dexterity)", "D", "I", 10, { recipe })]],
    ["quick 3 players", 7, () => three(6, { recipe })],
    ["solo", 6, () => [P("Ana alone (Strength)", "S", "D", 6, { recipe })]],
  ].map(([scene, tricks, players, ties]) => situation(`Recipe ${recipe}: ${scene}`, { tricks, tieStats: ties ? TIES() : undefined, players: players() }, "Starter recipe experiment."))),

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
