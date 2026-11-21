// Run bot checks through the rules engine and report outcome rates per player.
// Usage: node game/sim/engine_bots.mjs [checks]   (default 4000)
// The default scene matches situation 1 of docs/alternatives/TALLY_SIMULATIONS.md: 3 players, fresh starters, target 10.
import { createGame, apply } from "../engine/index.mjs";
import { playCheck } from "../engine/bot.mjs";

export const DEFAULT_SCENE = [
  { id: "ana", name: "Ana", primary: "S", secondary: "D", others: ["I", "W"], target: 10 },
  { id: "ben", name: "Ben", primary: "D", secondary: "I", others: ["S", "W"], target: 10 },
  { id: "cara", name: "Cara", primary: "I", secondary: "W", others: ["S", "D"], target: 10 },
];

export function runScene(scene, checks, seed = "parity") {
  const counts = Object.fromEntries(scene.map((c) => [c.id, { critical: 0, success: 0, partial: 0, failure: 0, bust: 0 }]));
  for (let i = 0; i < checks; i++) {
    let state = createGame({ seed: `${seed}-${i}` });
    for (const c of scene) state = apply(state, { type: "createCharacter", ...c }, { inPlace: true }).state;
    const goals = Object.fromEntries(scene.map((c) => [c.id, { target: c.target, approach: c.primary }]));
    const { results } = playCheck(state, { goals });
    for (const c of scene) counts[c.id][results[c.id].result]++;
  }
  const pct = Object.fromEntries(Object.entries(counts).map(([id, r]) => [id, Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round((1000 * v) / checks) / 10]))]));
  return pct;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/").replace(/^([A-Za-z]):/, "/$1:")}` || process.argv[1]?.endsWith("engine_bots.mjs")) {
  const checks = Number(process.argv[2]) || 4000;
  console.log(JSON.stringify(runScene(DEFAULT_SCENE, checks), null, 2));
}
