// The numbers RULES.md sets for a check: sizes, target ranges, difficulty bands and their simulated odds.
// One home for them: the engine, the pages (served at /engine/rules.mjs) and the simulators all import from here.
// A test checks that RULES.md's difficulty table matches DIFFICULTY_ODDS, so the two can't drift apart.

export const CHECK_KINDS = {
  standard: { tricks: (n) => 3 * n + 1, targets: [6, 28], defaultTarget: 12, label: "Standard", about: "3 tricks per player, +1. Targets 6–28." },
  quick: { tricks: (n) => 2 * n + 1, targets: [6, 17], defaultTarget: 10, label: "Quick", about: "2 tricks per player, +1. Targets 6–17." },
  solo: { tricks: () => 6, targets: [6, 20], defaultTarget: 12, label: "Solo", about: "One player, 6 tricks. Targets 6–20." },
};

// The preset number of tricks for a kind of check and a number of players.
export const presetTricks = (kind, players) => (CHECK_KINDS[kind] || CHECK_KINDS.standard).tricks(Math.max(1, players));

// Difficulty bands: [name, lowest target, highest target, the target a player picking the band suggests].
// Named from how often players who plan ahead succeed at 3–5 players (DIFFICULTY_ODDS): in standard and solo checks,
// Easy about 90% or more, Moderate about 85%, Hard about 70%, Very hard about 55%, Extreme about 40%, Heroic about 30%,
// Legendary about 20%. Quick checks, with fewer cards to plan with, sit a step lower: Easy about 80% down to Extreme
// about 33%.
export const DIFFICULTY = {
  standard: [["Easy", 6, 10, 8], ["Moderate", 11, 13, 12], ["Hard", 14, 16, 15], ["Very hard", 17, 19, 18], ["Extreme", 20, 22, 21], ["Heroic", 23, 25, 24], ["Legendary", 26, 28, 27]],
  quick: [["Easy", 6, 9, 8], ["Moderate", 10, 11, 10], ["Hard", 12, 13, 12], ["Very hard", 14, 15, 14], ["Extreme", 16, 17, 16]],
  solo: [["Easy", 6, 11, 9], ["Moderate", 12, 14, 12], ["Hard", 15, 16, 15], ["Very hard", 17, 18, 17], ["Extreme", 19, 20, 19]],
};

// Each band's simulated odds per player: success or better, exact hit and 7 or more short for players who plan
// ahead (look-ahead bots), and success or better for rough play (the engine's greedy bots). Standard and quick
// ranges cover 2–5 players. RULES.md prints the standard rows. Regenerate with `npm run sim:targets`, then update
// this and RULES.md together.
export const DIFFICULTY_ODDS = {
  standard: {
    Easy: { success: "87–96%", exact: "39–70%", short: "0–4%", rough: "50–68%" },
    Moderate: { success: "69–92%", exact: "26–55%", short: "2–12%", rough: "30–54%" },
    Hard: { success: "47–78%", exact: "17–42%", short: "7–34%", rough: "19–35%" },
    "Very hard": { success: "34–62%", exact: "9–28%", short: "24–49%", rough: "11–25%" },
    Extreme: { success: "21–48%", exact: "5–20%", short: "40–63%", rough: "4–16%" },
    Heroic: { success: "12–36%", exact: "3–15%", short: "53–77%", rough: "2–8%" },
    Legendary: { success: "6–26%", exact: "1–11%", short: "66–86%", rough: "1–5%" },
  },
  quick: {
    Easy: { success: "68–83%", exact: "24–45%", short: "0–13%", rough: "38–52%" },
    Moderate: { success: "55–80%", exact: "11–36%", short: "7–21%", rough: "26–44%" },
    Hard: { success: "35–64%", exact: "10–22%", short: "16–36%", rough: "15–29%" },
    "Very hard": { success: "25–46%", exact: "6–17%", short: "29–49%", rough: "9–18%" },
    Extreme: { success: "19–38%", exact: "4–14%", short: "45–65%", rough: "6–14%" },
  },
  solo: {
    Easy: { success: "93–97%", exact: "48–68%", short: "0–1%", rough: "49–64%" },
    Moderate: { success: "81–89%", exact: "37–45%", short: "2–5%", rough: "33–43%" },
    Hard: { success: "69–75%", exact: "25–31%", short: "8–11%", rough: "27–30%" },
    "Very hard": { success: "58–62%", exact: "18–21%", short: "16–20%", rough: "18–22%" },
    Extreme: { success: "41–49%", exact: "11–14%", short: "26–34%", rough: "13–16%" },
  },
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

// A one-line hint for a target someone is considering: its band and its odds.
export function difficultyHint(kind, target) {
  if (!Number.isInteger(target) || target < 1) return "Enter a whole number.";
  const bands = DIFFICULTY[kind] || DIFFICULTY.standard;
  const [lo, hi] = [bands[0][1], bands[bands.length - 1][2]];
  if (target < lo) return `Too low: below ${lo}, busts rise without making success likelier.`;
  if (target > hi) return `Beyond ${bands[bands.length - 1][0].toLowerCase()}: ${kind} checks run ${lo}–${hi}.`;
  const [name, blo, bhi] = bandOf(kind, target);
  const odds = (DIFFICULTY_ODDS[kind] || DIFFICULTY_ODDS.standard)[name];
  return `${name} (${blo}–${bhi})${odds ? `: success ${odds.success} for careful play, ${odds.rough} for rough play` : ""}.`;
}
