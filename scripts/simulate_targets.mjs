// The difficulty table in RULES.md, simulated with the rules engine itself (game/engine): the same rules and
// bots the app uses, so there is one implementation of the rules to keep right.
//
//   node scripts/simulate_targets.mjs [checks per cell] [--json]      (default 2000)
//
// For each check kind, player count and target, greedy bots with random starter decks play whole checks, every
// goal leaning on the player's primary suit. It prints RULES.md's table rows for standard checks (2–5 players)
// and DIFFICULTY_ODDS for game/engine/rules.mjs; game/test/rules_sync.test.mjs checks those two match.
import { createGame, apply } from "../game/engine/index.mjs";
import { playCheck } from "../game/engine/bot.mjs";
import { CHECK_KINDS, DIFFICULTY } from "../game/engine/rules.mjs";

const SUITS = ["S", "D", "I", "W"];
const CHECKS = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a))) || 2000;
const JSON_OUT = process.argv.includes("--json");

// A small deterministic shuffle for each bot's suits.
function pickSuits(seed) {
  const order = SUITS.slice();
  let x = (seed * 2654435761) >>> 0;
  for (let i = order.length - 1; i > 0; i--) { x = (x * 1664525 + 1013904223) >>> 0; const j = x % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

function cell(kind, players, target, checks) {
  const counts = { critical: 0, success: 0, partial: 0, failure: 0, bust: 0 };
  for (let i = 0; i < checks; i++) {
    let state = createGame({ seed: `${kind}-${players}-${target}-${i}` });
    const goals = {};
    for (let p = 0; p < players; p++) {
      const [primary, secondary, a, b] = pickSuits(i * 31 + p * 7 + target);
      const id = `c${p}`;
      state = apply(state, { type: "createCharacter", id, name: id, primary, secondary, others: [a, b] }, { inPlace: true }).state;
      goals[id] = { target, approach: primary };
    }
    const { results } = playCheck(state, { kind, goals });
    for (const r of Object.values(results)) counts[r.result]++;
  }
  const n = checks * players;
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round((1000 * v) / n) / 10]));
}

const out = {};
for (const [kind, spec] of Object.entries(CHECK_KINDS)) {
  out[kind] = {};
  for (const players of kind === "solo" ? [1] : [2, 3, 4, 5]) {
    out[kind][players] = [];
    for (let target = 1; target <= spec.targets[1]; target++) out[kind][players].push({ target, ...cell(kind, players, target, kind === "solo" ? CHECKS * 2 : CHECKS) });
  }
}

if (JSON_OUT) console.log(JSON.stringify(out));
else {
  const range = (rows, k) => { const v = rows.map((r) => r[k]); return `${Math.round(Math.min(...v))}–${Math.round(Math.max(...v))}%`; };
  console.log(`Standard checks, 2–5 players, ${CHECKS} checks per cell. RULES.md rows:\n`);
  console.log("| Target | Difficulty | Exact hit | 7 or more short | Bust |\n| --- | --- | --- | --- | --- |");
  const odds = {};
  for (const [name, lo, hi] of DIFFICULTY.standard) {
    const rows = [2, 3, 4, 5].flatMap((p) => out.standard[p].filter((r) => r.target >= lo && r.target <= hi));
    odds[name] = { exact: range(rows, "critical"), short: range(rows, "failure"), bust: range(rows, "bust") };
    console.log(`| ${lo}–${hi} | ${name} | ${odds[name].exact} | ${odds[name].short} | ${odds[name].bust} |`);
  }
  console.log("\nDIFFICULTY_ODDS for game/engine/rules.mjs:\n" + JSON.stringify(odds, null, 2));
  for (const kind of ["quick", "solo"]) {
    const p = kind === "solo" ? 1 : 3;
    console.log(`\n${kind} (${p} player${p > 1 ? "s" : ""}), exact / bust at targets 6, 9, 12: ` + [6, 9, 12].map((t) => { const r = out[kind][p].find((x) => x.target === t); return `${r.critical}% / ${r.bust}%`; }).join(", "));
  }
}
