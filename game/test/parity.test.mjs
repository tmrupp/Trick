// The engine's bots should land where the simulator does for situation 1 under the current rules
// (node scripts/simulate_tally.mjs 20000 "^1\. Default": blind Peek, two-of-each starter).
import test from "node:test";
import assert from "node:assert/strict";
import { runScene, DEFAULT_SCENE } from "../sim/engine_bots.mjs";

const PUBLISHED = {
  ana: { critical: 20, failure: 8, bust: 11 },
  ben: { critical: 13, failure: 17, bust: 10 },
  cara: { critical: 12, failure: 12, bust: 20 },
};

test("engine bots match the published default scene within 3 points", () => {
  const got = runScene(DEFAULT_SCENE, 3000, "parity-test");
  for (const [id, want] of Object.entries(PUBLISHED)) {
    for (const [k, v] of Object.entries(want)) {
      assert.ok(Math.abs(got[id][k] - v) <= 3, `${id} ${k}: engine ${got[id][k]}%, published ${v}%`);
    }
  }
});
