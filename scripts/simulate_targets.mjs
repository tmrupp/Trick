// The difficulty table in RULES.md and DIFFICULTY_ODDS in game/engine/rules.mjs, simulated two ways:
// - careful play: look-ahead bots that replay the rest of the check before each card. Only the rules lab
//   (scripts/simulate_tally.mjs, Part 6) has them, so this runs its "Targets look …" cells, many at once;
// - rough play: the rules engine's own greedy bots (game/engine/bot.mjs), the same ones the app's bot seats use.
//
//   node scripts/simulate_targets.mjs [--checks N] [--cells DIR] [--jobs N] [--rough-only] [--json]
//
// The look-ahead cells are slow (about an hour on 16 cores at the default sizes). Each cell's JSON is kept in
// --cells (default scripts/.targets-cells) and reused on the next run, so delete that folder after a rule change.
// --rough-only skips them and prints only the engine's rough-play odds. It prints RULES.md's rows for standard
// checks (2–5 players) and DIFFICULTY_ODDS; game/test/rules_sync.test.mjs checks those two match.
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createGame, apply } from "../game/engine/index.mjs";
import { playCheck } from "../game/engine/bot.mjs";
import { CHECK_KINDS, DIFFICULTY } from "../game/engine/rules.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const CHECKS = Number(arg("--checks", 2000));
const CELLS = arg("--cells", join(HERE, ".targets-cells"));
const JOBS = Number(arg("--jobs", Math.max(1, cpus().length - 2)));
const ROUGH_ONLY = process.argv.includes("--rough-only");
const JSON_OUT = process.argv.includes("--json");
const SUITS = ["S", "D", "I", "W"];
const PLAYERS = { standard: [2, 3, 4, 5], quick: [2, 3, 4, 5], solo: [1] };
// Look-ahead checks per cell: bigger tables are slower to replay, so they get fewer.
const LOOK_CHECKS = { standard: { 2: 1000, 3: 800, 4: 500, 5: 400 }, quick: { 2: 1500, 3: 1200, 4: 900, 5: 700 }, solo: { 1: 3000 } };
const targetsOf = (kind) => { const [lo, hi] = CHECK_KINDS[kind].targets; return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i); };

// A small deterministic shuffle for each bot's suits.
function pickSuits(seed) {
  const order = SUITS.slice();
  let x = (seed * 2654435761) >>> 0;
  for (let i = order.length - 1; i > 0; i--) { x = (x * 1664525 + 1013904223) >>> 0; const j = x % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

// Rough play: the engine's greedy bots. Returns percentages { critical, success, partial, failure, bust }.
function rough(kind, players, target, checks) {
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
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, (100 * v) / n]));
}

// Careful play: one lab process per cell, JOBS at a time, each cell's output cached in CELLS.
const labName = (kind, players, target) => `Targets look ${kind === "standard" ? "" : `${kind} `}${players}p: target ${target}`;
const cellFile = (name) => join(CELLS, name.replace(/[^a-z0-9]+/gi, "_") + ".json");
async function runLab() {
  mkdirSync(CELLS, { recursive: true });
  const jobs = [];
  for (const kind of Object.keys(PLAYERS)) for (const p of PLAYERS[kind]) for (const t of targetsOf(kind)) {
    const name = labName(kind, p, t);
    if (!existsSync(cellFile(name))) jobs.push({ name, checks: LOOK_CHECKS[kind][p] });
  }
  if (!jobs.length) return;
  let next = 0, done = 0;
  const started = Date.now();
  await new Promise((finish, fail) => {
    const launch = () => {
      while (next < jobs.length && next - done < JOBS) {
        const job = jobs[next++], chunks = [];
        const child = spawn(process.execPath, [join(HERE, "simulate_tally.mjs"), String(job.checks), `^${job.name}$`]);
        child.stdout.on("data", (d) => chunks.push(d));
        child.on("close", (code) => {
          if (code !== 0) return fail(new Error(`${job.name} failed`));
          writeFileSync(cellFile(job.name), Buffer.concat(chunks));
          done++;
          process.stderr.write(`\r${done}/${jobs.length} look-ahead cells, ${Math.round((Date.now() - started) / 60000)} min`);
          if (done === jobs.length) { process.stderr.write("\n"); finish(); } else launch();
        });
      }
    };
    launch();
  });
}
function careful(kind, players, target) {
  const s = JSON.parse(readFileSync(cellFile(labName(kind, players, target)), "utf8")).situations[0];
  const avg = (k) => s.players.reduce((a, x) => a + parseInt(x[k], 10), 0) / s.players.length;
  return Object.fromEntries(["critical", "success", "partial", "failure", "bust"].map((k) => [k, avg(k)]));
}

if (!ROUGH_ONLY) await runLab();
const out = {};
for (const kind of Object.keys(PLAYERS)) {
  out[kind] = {};
  for (const p of PLAYERS[kind]) out[kind][p] = targetsOf(kind).map((target) => ({
    target, rough: rough(kind, p, target, kind === "solo" ? CHECKS * 2 : CHECKS), careful: ROUGH_ONLY ? null : careful(kind, p, target),
  }));
}

if (JSON_OUT) console.log(JSON.stringify(out));
else {
  const range = (v) => `${Math.round(Math.min(...v))}–${Math.round(Math.max(...v))}%`;
  const succ = (r) => r.critical + r.success;
  const odds = {};
  for (const kind of Object.keys(PLAYERS)) {
    odds[kind] = {};
    for (const [name, lo, hi] of DIFFICULTY[kind]) {
      const rows = PLAYERS[kind].flatMap((p) => out[kind][p].filter((r) => r.target >= lo && r.target <= hi));
      odds[kind][name] = { rough: range(rows.map((r) => succ(r.rough))), roughBust: range(rows.map((r) => r.rough.bust)) };
      if (!ROUGH_ONLY) Object.assign(odds[kind][name], { success: range(rows.map((r) => succ(r.careful))), exact: range(rows.map((r) => r.careful.critical)), short: range(rows.map((r) => r.careful.failure)), bust: range(rows.map((r) => r.careful.bust)) });
    }
  }
  if (!ROUGH_ONLY) {
    console.log("RULES.md rows, standard checks at 2–5 players:\n");
    console.log("| Target | Difficulty | Success or better | Exact hit | 7 or more short | Rough play: success |\n| --- | --- | --- | --- | --- | --- |");
    for (const [name, lo, hi] of DIFFICULTY.standard) { const o = odds.standard[name]; console.log(`| ${lo}–${hi} | ${name} | ${o.success} | ${o.exact} | ${o.short} | ${o.rough} |`); }
  }
  const pick = (o) => Object.fromEntries(Object.entries(o).map(([n, v]) => [n, ROUGH_ONLY ? v : { success: v.success, exact: v.exact, short: v.short, rough: v.rough }]));
  console.log("\nDIFFICULTY_ODDS for game/engine/rules.mjs:\n" + JSON.stringify({ standard: pick(odds.standard), quick: pick(odds.quick), solo: pick(odds.solo) }, null, 2));
  console.log("\nBusts, careful / rough, by band:\n" + Object.entries(odds).map(([kind, o]) => `${kind}: ` + Object.entries(o).map(([n, v]) => `${n} ${v.bust ?? "—"} / ${v.roughBust}`).join("; ")).join("\n"));
}
