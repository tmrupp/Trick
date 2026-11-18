// The engine's bots should land where the simulator does for situation 1 under the current rules
// (node scripts/simulate_tally.mjs 20000 "^1\. Default": Peek as a blind choice, Mirror on your next card, two-of-each starter).
import test from "node:test";
import assert from "node:assert/strict";
import { runScene, DEFAULT_SCENE } from "../sim/engine_bots.mjs";

const PUBLISHED = {
  ana: { critical: 21, failure: 7, bust: 9 },
  ben: { critical: 14, failure: 16, bust: 8 },
  cara: { critical: 15, failure: 11, bust: 18 },
};

test("engine bots match the published default scene within 3 points", () => {
  const got = runScene(DEFAULT_SCENE, 3000, "parity-test");
  for (const [id, want] of Object.entries(PUBLISHED)) {
    for (const [k, v] of Object.entries(want)) {
      assert.ok(Math.abs(got[id][k] - v) <= 3, `${id} ${k}: engine ${got[id][k]}%, published ${v}%`);
    }
  }
});
