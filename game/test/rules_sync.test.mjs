// RULES.md and the engine's rules.mjs must agree on check sizes and the difficulty table: one set of numbers.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CHECK_KINDS, DIFFICULTY, DIFFICULTY_ODDS } from "../engine/rules.mjs";

const md = readFileSync(new URL("../../RULES.md", import.meta.url), "utf8");

test("RULES.md's difficulty table matches rules.mjs", () => {
  for (const [name, lo, hi] of DIFFICULTY.standard) {
    const o = DIFFICULTY_ODDS.standard[name];
    const row = `| ${lo}–${hi} | ${name} | ${o.success} | ${o.exact} | ${o.short} | ${o.rough} |`;
    assert.ok(md.includes(row), `RULES.md should have the row: ${row}`);
  }
});

test("RULES.md's quick and solo bands and check sizes match rules.mjs", () => {
  for (const kind of ["quick", "solo"]) {
    const list = DIFFICULTY[kind].map(([name, lo, hi]) => `**${name}** ${lo}–${hi}`);
    const sentence = `${kind === "quick" ? "Quick" : "Solo"} checks run ${list.slice(0, -1).join(", ")} and ${list.at(-1)}.`;
    assert.ok(md.includes(sentence), `RULES.md should say: ${sentence}`);
  }
  for (const [kind, spec] of Object.entries(CHECK_KINDS)) {
    const row = `| ${spec.label} | ${kind === "solo" ? "6" : `${kind === "standard" ? 3 : 2} per player, +1`} | ${spec.targets[0]}–${spec.targets[1]} | ${spec.defaultTarget} |`;
    assert.ok(md.includes(row), `RULES.md should have the row: ${row}`);
  }
});

test("every band has odds, and the bands tile each check's target range", () => {
  for (const [kind, bands] of Object.entries(DIFFICULTY)) {
    assert.equal(bands[0][1], CHECK_KINDS[kind].targets[0]);
    assert.equal(bands.at(-1)[2], CHECK_KINDS[kind].targets[1]);
    bands.forEach(([name, lo, hi, suggest], i) => {
      assert.ok(DIFFICULTY_ODDS[kind][name], `${kind} ${name} has odds`);
      assert.ok(suggest >= lo && suggest <= hi, `${kind} ${name} suggests a target inside it`);
      if (i) assert.equal(lo, bands[i - 1][2] + 1, `${kind} ${name} follows on`);
    });
  }
});
