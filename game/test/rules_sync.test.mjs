// RULES.md and the engine's rules.mjs must agree on the difficulty table: one set of numbers.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DIFFICULTY, DIFFICULTY_ODDS } from "../engine/rules.mjs";

test("RULES.md's difficulty table matches rules.mjs", () => {
  const md = readFileSync(new URL("../../RULES.md", import.meta.url), "utf8");
  for (const [name, lo, hi] of DIFFICULTY.standard) {
    const odds = DIFFICULTY_ODDS[name];
    const row = `| ${lo}–${hi} | ${name} | ${odds.exact} | ${odds.short} | ${odds.bust} |`;
    assert.ok(md.includes(row), `RULES.md should have the row: ${row}`);
  }
});
