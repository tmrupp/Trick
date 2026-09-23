// Shared current text for the optional peoples of Black Valley.
// This file drives the race reference cards, the gallery, race_mechanics.html,
// and the card exports. RULES.md remains the full rules reference.

const RACE_PAGE_PATH = "races/race_card.html";

const RACE_ICONS = {
  // Two closed links: a bargain that cannot be slipped.
  varn: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="37" cy="50" r="24" /><circle cx="63" cy="50" r="24" /></g></svg>`,
  // A blind eye with a candleflame where the pupil should sit.
  "moon-eyed": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 50 C 28 24 72 24 90 50 C 72 76 28 76 10 50 Z" /><path d="M 50 34 C 40 44 42 56 50 64 C 58 56 60 44 50 34 Z" /></g></svg>`,
  // Ridge horns sweeping up from the brow.
  tarrans: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M 38 56 L 62 56 L 57 84 Q 50 91 43 84 Z" /><path d="M 38 60 L 20 67" /><path d="M 62 60 L 80 67" /><path d="M 40 56 C 32 42 26 30 34 18" /><path d="M 60 56 C 68 42 74 30 66 18" /></g></svg>`,
  // A worn face with hollow eyes, ripped open along the jaw where the hungry thing shows through.
  "hollow-skinned": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M 70 82 C 64 87 57 90 50 90 C 34 90 21 74 21 50 C 21 28 33 10 50 10 C 67 10 79 28 79 50 C 79 54 79 58 78 62" /><path d="M 78 62 L 70 66 L 75 71 L 66 76 L 70 82" /><circle cx="37" cy="42" r="6" /><circle cx="63" cy="42" r="6" /></g></svg>`,
  // One half drawn whole, one half only half there: mortal beside green spirit.
  rootborn: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M 50 12 A 38 38 0 0 1 50 88" /><path d="M 50 12 A 38 38 0 0 0 50 88" stroke-dasharray="11 12" /><path d="M 50 12 L 50 88" /></g></svg>`,
  // Banked ember over running water.
  ashcrik: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M 50 14 C 36 32 42 46 50 56 C 58 46 64 32 50 14 Z" /><path d="M 14 74 C 26 62 32 84 44 74 C 56 64 62 84 74 74 C 80 68 84 72 88 76" /></g></svg>`,
  // Timing: the same glass for everyone.
  "shared-timing": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M 26 16 L 74 16 L 50 50 L 74 84 L 26 84 L 50 50 Z" /><path d="M 18 16 L 82 16" /><path d="M 18 84 L 82 84" /></g></svg>`
};

function racePalette(accent) {
  return {
    "--card-bg-top": "#ffffff",
    "--card-bg-bottom": "#ffffff",
    "--outer-border": "#d9dee5",
    "--panel-bg": "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.98) 100%)",
    "--accent": accent,
    "--text-main": "#111111",
    "--text-muted": "rgba(17,17,17,0.35)",
    "--frame-highlight": "rgba(17,17,17,0.2)"
  };
}

const RACE_ENTRIES = [
  {
    id: "varn",
    name: "Varn",
    abilityTitle: "Binding bargain",
    tags: ["Bargain Folk", "Town Brokers"],
    accent: "#a8791f",
    flavor: "Small goblin-rat folk with neat hands, quick teeth, and no wasted words.",
    rules: [
      "Any pact you make with a mortal binds both of you to its terms.",
      "Before drawing, name the bargain you would strike this check.",
      "Once per check, before a lead, you may strike it: gain 1 Curse (compulsion: its terms), then shuffle and discard your hand and draw the same number of cards."
    ],
    previewDescription: "Your pacts bind both sides; strike a named bargain for a Curse and a whole new hand."
  },
  {
    id: "moon-eyed",
    name: "Moon-Eyed",
    abilityTitle: "Wax resilience",
    tags: ["Wax Folk", "Night Keepers"],
    accent: "#6a7f9c",
    flavor: "Wax-skinned folk with a candleflame behind each blind eye. What would kill others only softens them, and they set again.",
    rules: [
      "You sense warmth, movement, nearness, and drafts even in complete darkness, but cannot perceive color, writing, or other purely visual detail.",
      "When you must draw from an empty deck, after any evolution and before shuffling, you may return 1 Injury from discard to reserve.",
      "When the scene is dark, once per check before a lead, you may discard 1 card from hand and draw 1."
    ],
    previewDescription: "Work an Injury out whenever your deck reshuffles, and in the dark trade one card for another."
  },
  {
    id: "tarrans",
    name: "Tarrans",
    abilityTitle: "Burden eater",
    tags: ["Ridge Herders", "Ichor Carriers"],
    accent: "#4f7a4a",
    flavor: "Goatlike ridge-walkers who ferry flocks and raw ichor over roads no one else trusts.",
    rules: [
      "Whenever you draw a Curse, draw 1 extra card.",
      "However many Curses are outside your reserve, each violation of your compulsion gains only 1 Stress.",
      "Steepness, loose stone, narrow footing, and another person's weight cannot make you lose your footing; magic or active interference still can.",
      "You can drink raw ichor without its ordinary craving. By taste, you know whether it has been diluted, poisoned, or altered. Each draught leaves a visible dark ring in your horns."
    ],
    previewDescription: "Curses feed your hand but never spiral into craving; no ordinary burden breaks your footing, and raw ichor reveals itself by taste."
  },
  {
    id: "hollow-skinned",
    name: "Hollow-Skinned",
    abilityTitle: "Feeding curse",
    tags: ["Mimics", "Feared Neighbors"],
    accent: "#9c4a3c",
    flavor: "They eat a person and wear the body, never the memories. The disguise is skin-deep; one tear spills the hungry thing beneath.",
    rules: [
      "When you gain an Injury while another Injury is already in your discard, gain 1 Curse (compulsion: you hunger for another vessel to inhabit).",
      "While any Curse is outside your reserve, draw 2 extra cards after the deal when your approach is Strength.",
      "While wearing a borrowed body, you also gain the ability of that person's people; agree what this means before drawing."
    ],
    previewDescription: "Wounds feed the hunger for a new vessel: a second Injury breeds a Curse, and while cursed you draw two extra cards on Strength checks."
  },
  {
    id: "rootborn",
    name: "Rootborn",
    abilityTitle: "Rebalancing growth",
    tags: ["Pact Children", "Green Kin"],
    accent: "#7a5aa8",
    flavor: "Half mortal, half nature spirit: children of the orchard, spring, or grove their family once made terms with.",
    rules: [
      "When you must draw from an empty deck, you may evolve up to twice before shuffling instead of once. Resolve each evolution separately.",
      "After tending local flora, ask it one question about what it has sensed nearby; how well the place has been tended decides how truthfully it answers."
    ],
    previewDescription: "Whenever your deck reshuffles, you may evolve twice instead of once; tended places answer truly."
  },
  {
    id: "ashcrik",
    name: "Ashcrik",
    abilityTitle: "Reed and ember",
    tags: ["Creek and Cinder", "Threshold Folk"],
    accent: "#c1622a",
    flavor: "Creek-and-cinder folk who fast to pass between reed-cool water and banked ember, at dawn, at dusk, or wherever water meets heat.",
    rules: [
      "In reed-form, you can breathe underwater and move freely through water or mud. In ember-form, you can breathe smoke and withstand ordinary heat and flame.",
      "In reed-form, draw 1 extra card after the deal when your approach is Dexterity. In ember-form, do so when your approach is Strength.",
      "To switch, declare a fast before a check and carry it across two reshuffles, gaining 1 Stumble at each; switch after the second. Interrupting the fast cancels the switch and adds 1 Stress."
    ],
    previewDescription: "An extra card on Dexterity or Strength checks, depending on form, and a costly fast to change."
  }
];

const SHARED_TIMING = {
  id: "shared-timing",
  name: "Shared timing",
  abilityTitle: "Every people",
  tags: ["All Peoples"],
  accent: "#4a5a66",
  flavor: "Use with the core rules. These setting abilities are optional additions.",
  rules: [
    "Agree abilities and any goal requirements before drawing.",
    "Extra cards do not add tricks; discard them with the leftovers at cleanup.",
    "Extra draws are drawing, so Stress duplicates on them too."
  ],
  previewDescription: "The timing every ability obeys, printed on the back of each people's card."
};

const ALL_RACE_ENTRIES = [...RACE_ENTRIES, SHARED_TIMING];

function buildRaceLines(entry) {
  return [`<em>${entry.flavor}</em>`, ...entry.rules];
}

function buildRaceConfig(entry) {
  return {
    cardClass: entry.id === "shared-timing" ? "race-card race-timing-card" : "race-card",
    cssVars: racePalette(entry.accent),
    value: "",
    suitLabel: `${entry.name} mark`,
    suitSvg: RACE_ICONS[entry.id],
    domain: entry.abilityTitle,
    title: entry.name.toUpperCase(),
    lines: buildRaceLines(entry)
  };
}

function buildRaceHref(id) {
  return `./${RACE_PAGE_PATH}?id=${encodeURIComponent(id)}`;
}

function toRuntimeRace(entry) {
  return {
    ...entry,
    label: entry.name,
    file: RACE_PAGE_PATH,
    params: { id: entry.id },
    config: buildRaceConfig(entry)
  };
}

const raceCatalog = ALL_RACE_ENTRIES.map(toRuntimeRace);
const raceCatalogById = new Map(raceCatalog.map((entry) => [entry.id, entry]));

function getRaceCardById(id) {
  return raceCatalogById.get(id) || null;
}

// Every people's card shares the timing card as its back.
function buildRaceDeckCards() {
  return raceCatalog
    .filter((entry) => entry.id !== SHARED_TIMING.id)
    .map(({ id, label, file, params }) => ({
      id,
      label,
      file,
      params,
      backFile: RACE_PAGE_PATH,
      backParams: { id: SHARED_TIMING.id }
    }));
}

function buildRaceIndexSection() {
  return {
    id: "peoples",
    title: "Optional peoples",
    copy: "One card per people; the shared timing card is their common back",
    cards: raceCatalog.map((entry) => ({
      id: entry.id,
      label: entry.name,
      name: entry.name,
      eyebrow: entry.abilityTitle,
      description: entry.previewDescription,
      href: buildRaceHref(entry.id),
      iframeSrc: buildRaceHref(entry.id),
      title: `${entry.name} preview`
    }))
  };
}

globalThis.TrickRaceCatalog = {
  raceCatalog,
  raceEntries: RACE_ENTRIES,
  sharedTiming: SHARED_TIMING,
  getRaceCardById,
  buildRaceDeckCards,
  buildRaceIndexSection
};
