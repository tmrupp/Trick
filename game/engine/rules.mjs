// The numbers RULES.md sets for a check: sizes, target ranges, difficulty bands and their simulated odds.
// One home for them: the engine, the pages (served at /engine/rules.mjs) and the simulators all import from here.
// A test checks that RULES.md's difficulty table matches DIFFICULTY_ODDS, so the two can't drift apart.

export const CHECK_KINDS = {
  standard: { tricks: (n) => 3 * n + 1, targets: [6, 20], defaultTarget: 10, label: "Standard", about: "3 tricks per player, +1. Targets 6–20." },
  quick: { tricks: (n) => 2 * n + 1, targets: [6, 12], defaultTarget: 6, label: "Quick", about: "2 tricks per player, +1. Targets 6–12." },
  solo: { tricks: () => 6, targets: [6, 12], defaultTarget: 6, label: "Solo", about: "One player, 6 tricks. Targets 6–12." },
};

// The preset number of tricks for a kind of check and a number of players.
export const presetTricks = (kind, players) => (CHECK_KINDS[kind] || CHECK_KINDS.standard).tricks(Math.max(1, players));

// Difficulty bands: [name, lowest target, highest target, the target a player picking the band suggests].
export const DIFFICULTY = {
  standard: [["Easy", 6, 8, 7], ["Moderate", 9, 11, 10], ["Hard", 12, 14, 13], ["Very hard", 15, 17, 16], ["Extreme", 18, 20, 19]],
  quick: [["Easy", 6, 8, 7], ["Moderate", 9, 10, 9], ["Hard", 11, 12, 11]],
};
DIFFICULTY.solo = DIFFICULTY.quick;

// RULES.md's difficulty table for standard checks (2–5 players): exact hit, 7 or more short, bust.
// Regenerate with `npm run sim:targets`, then update this and RULES.md together.
export const DIFFICULTY_ODDS = {
  Easy: { exact: "20–24%", short: "0–12%", bust: "11–18%" },
  Moderate: { exact: "12–21%", short: "10–21%", bust: "7–14%" },
  Hard: { exact: "7–13%", short: "23–40%", bust: "4–8%" },
  "Very hard": { exact: "4–9%", short: "41–62%", bust: "3–5%" },
  Extreme: { exact: "2–6%", short: "59–76%", bust: "1–3%" },
};

// The band a target falls in, or null outside the range.
export function bandOf(kind, target) {
  if (!Number.isInteger(target)) return null;
  return (DIFFICULTY[kind] || DIFFICULTY.standard).find(([, lo, hi]) => target >= lo && target <= hi) || null;
}

// A one-word difficulty for a target: "easy", "hard", "too low", "beyond extreme".
export function difficulty(kind, target) {
  if (!Number.isInteger(target)) return "";
  const bands = DIFFICULTY[kind] || DIFFICULTY.standard;
  const band = bandOf(kind, target);
  if (band) return band[0].toLowerCase();
  return target < bands[0][1] ? "too low" : `beyond ${bands[bands.length - 1][0].toLowerCase()}`;
}

// A one-line hint for a target someone is considering: its band and, for standard checks, the odds.
export function difficultyHint(kind, target) {
  if (!Number.isInteger(target) || target < 1) return "Enter a whole number.";
  const bands = DIFFICULTY[kind] || DIFFICULTY.standard;
  const [lo, hi] = [bands[0][1], bands[bands.length - 1][2]];
  if (target < lo) return `Too low: below ${lo}, busts rise without making success likelier.`;
  if (target > hi) return `Beyond ${bands[bands.length - 1][0].toLowerCase()}: ${kind} checks run ${lo}–${hi}.`;
  const [name, blo, bhi] = bandOf(kind, target);
  const odds = kind === "standard" && DIFFICULTY_ODDS[name];
  return `${name} (${blo}–${bhi})${odds ? `: exact hit ${odds.exact}, bust ${odds.bust}` : ""}.`;
}
