// The engine's bots should land where the published simulations do (TALLY_SIMULATIONS.md, situation 1).
import test from "node:test";
import assert from "node:assert/strict";
import { runScene, DEFAULT_SCENE } from "../sim/engine_bots.mjs";

const PUBLISHED = {
  ana: { critical: 21, failure: 7, bust: 10 },
  ben: { critical: 15, failure: 16, bust: 9 },
  cara: { critical: 15, failure: 11, bust: 19 },
};

test("engine bots match the published default scene within 3 points", () => {
  const got = runScene(DEFAULT_SCENE, 3000, "parity-test");
  for (const [id, want] of Object.entries(PUBLISHED)) {
    for (const [k, v] of Object.entries(want)) {
      assert.ok(Math.abs(got[id][k] - v) <= 3, `${id} ${k}: engine ${got[id][k]}%, published ${v}%`);
    }
  }
});
