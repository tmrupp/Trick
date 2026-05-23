const ITEM_PAGE_PATH = "items/item_card.html";

const SUIT_DEFINITIONS = {
  strength: {
    name: "Strength",
    suitLabel: "Strength suit",
    svgPath: "../strength.svg",
    cssVars: {
      "--card-bg-top": "#5d231f",
      "--card-bg-bottom": "#351513",
      "--outer-border": "#220c0a",
      "--panel-bg": "linear-gradient(90deg, rgba(32,7,4,0.96) 0%, rgba(20,4,2,0.98) 100%)",
      "--accent": "#ff7c6a",
      "--text-main": "#fff5f2",
      "--text-muted": "rgba(255,235,231,0.2)",
      "--frame-highlight": "rgba(255,242,239,0.92)"
    }
  },
  dexterity: {
    name: "Dexterity",
    suitLabel: "Dexterity suit",
    svgPath: "../dexterity.svg",
    cssVars: {
      "--card-bg-top": "#214f2b",
      "--card-bg-bottom": "#132f1a",
      "--outer-border": "#09170d",
      "--panel-bg": "linear-gradient(90deg, rgba(8,25,11,0.96) 0%, rgba(4,14,6,0.98) 100%)",
      "--accent": "#77e88e",
      "--text-main": "#f3fff5",
      "--text-muted": "rgba(235,255,239,0.2)",
      "--frame-highlight": "rgba(242,255,245,0.92)"
    }
  },
  intelligence: {
    name: "Intelligence",
    suitLabel: "Intelligence suit",
    svgPath: "../intelligence.svg",
    cssVars: {
      "--card-bg-top": "#1e345f",
      "--card-bg-bottom": "#101c36",
      "--outer-border": "#09101f",
      "--panel-bg": "linear-gradient(90deg, rgba(6,12,32,0.96) 0%, rgba(3,7,18,0.98) 100%)",
      "--accent": "#7fb5ff",
      "--text-main": "#f3f8ff",
      "--text-muted": "rgba(232,241,255,0.2)",
      "--frame-highlight": "rgba(241,246,255,0.92)"
    }
  },
  weird: {
    name: "Weird",
    suitLabel: "Weird suit",
    svgPath: "../weird.svg",
    cssVars: {
      "--card-bg-top": "#2a1738",
      "--card-bg-bottom": "#160c1d",
      "--outer-border": "#0b0610",
      "--panel-bg": "linear-gradient(90deg, rgba(18,10,24,0.96) 0%, rgba(8,4,12,0.98) 100%)",
      "--accent": "#c784ff",
      "--text-main": "#fbf4ff",
      "--text-muted": "rgba(248,236,255,0.2)",
      "--frame-highlight": "rgba(249,239,255,0.92)"
    }
  }
};

const SECTION_DEFINITIONS = {
  trinket: {
    id: "trinkets",
    title: "Trinkets",
    copy: "Portable occult items with visible costs on the front"
  },
  relic: {
    id: "relics",
    title: "Relics",
    copy: "Major items with their visible invocation and effect text"
  },
  reveal: {
    id: "reveals",
    title: "Reveal Cards",
    copy: "Keep these hidden until the corresponding relic is invoked"
  }
};

const ITEM_ENTRIES = [
  {
    id: "black-wedge",
    label: "Black Wedge",
    title: "BLACK WEDGE",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "Rule: Drive it into wood, a doorframe, or packed earth before the work starts.",
      "Effect: In a Strength check, draw 1 extra card before the first trick.",
      "Cost: On the next trick, you must play your highest valid card.",
      "<em>Mark: Your palm stays soot-dark until the check ends.</em>"
    ],
    previewDescription: "Wake it in wood or earth to draw deeper, then commit hard on the next trick."
  },
  {
    id: "grip-bone",
    label: "Grip Bone",
    title: "GRIP BONE",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "Rule: Clench it in the same hand you work with.",
      "Effect: In a Strength check, discard 1 and draw 1; if the new card is Strength, draw 1 more and keep it.",
      "Cost: If you use it, you cannot choose your consolation when you lose the next trick.",
      "<em>Mark: That hand cramps and trembles whenever you try anything delicate.</em>"
    ],
    previewDescription: "Turns a hard grip into better Strength finds at the cost of control."
  },
  {
    id: "red-thread",
    label: "Red Thread",
    title: "RED THREAD",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "Rule: Tie it around a finger, button, or wrist before the check starts.",
      "Effect: In a Dexterity check, set 1 card aside face down. At a later trick, return it to hand and discard 1.",
      "Cost: When the tucked card comes back, you must discard 1 card.",
      "<em>Mark: The thread leaves a raw red line behind.</em>"
    ],
    previewDescription: "Tuck one move away and pull it back when the timing is right."
  },
  {
    id: "crooked-key",
    label: "Crooked Key",
    title: "CROOKED KEY",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "Rule: Place it inside a real lock. Afterward that lock is spoiled and will not properly close again.",
      "Effect: In a Dexterity check, after either side leads a trick, draw 1 card.",
      "Play it instead of a card from hand if valid for that trick; otherwise discard it immediately.",
      "Price: No immediate mechanical cost."
    ],
    previewDescription: "Plays a sudden drawn card off a real ruined lock."
  },
  {
    id: "slate-shard",
    label: "Slate Shard",
    title: "SLATE SHARD",
    kind: "trinket",
    suit: "intelligence",
    domain: "Trinket",
    lines: [
      "Rule: Fog it with your breath and trace one line across it with a fingernail.",
      "Effect: In an Intelligence check, look at the top 2 cards of your deck, reorder them, then draw 1.",
      "Cost: Discard 1 card from your hand.",
      "<em>Mark: Half-figures show up on nearby glass, dust, or still water.</em>"
    ],
    previewDescription: "A planning shard that trades a card for cleaner future draws."
  },
  {
    id: "tally-nail",
    label: "Tally Nail",
    title: "TALLY NAIL",
    kind: "trinket",
    suit: "intelligence",
    domain: "Trinket",
    lines: [
      "Rule: Charge it by marking and quietly counting something real: breaths, steps, drops, heartbeats, or coins.",
      "Effect: At the beginning of a challenge, look at the open hand and move 1 card to a different position.",
      "Cost: No immediate mechanical cost, but an uncharged nail does nothing.",
      "<em>Mark: The count is spent and you keep muttering numbers until the check ends.</em>"
    ],
    previewDescription: "A pre-charged count that lets you shift one open-hand card before the challenge starts."
  },
  {
    id: "whisper-jar",
    label: "Whisper Jar",
    title: "WHISPER JAR",
    kind: "trinket",
    suit: "weird",
    domain: "Trinket",
    lines: [
      "Rule: Whisper a true fear into the jar and seal it with your thumb.",
      "Effect: Open it in a check and choose 1 card in the opposing hand; that card is treated as Stress for the rest of the check.",
      "Cost: The fear is heard by everyone nearby and the jar cannot hold that fear again until recharged.",
      "<em>Mark: People keep glancing over their shoulders as if someone just spoke behind them.</em>"
    ],
    previewDescription: "Lets one true fear out into the room and stains a chosen opposing card with Stress."
  },
  {
    id: "borrowed-face",
    label: "Borrowed Face",
    title: "BORROWED FACE",
    kind: "trinket",
    suit: "weird",
    domain: "Trinket",
    lines: [
      "Rule: Press the funeral wax over your face for a breath and let it warm there.",
      "Effect: In a Weird check, flip the omen card. The first trick led with that omen suit has its winner inverted.",
      "Cost: If no trick is led with that suit before the check ends, add 1 Stress after the check.",
      "<em>Mark: Mirrors and still water show you wearing the wrong expression a moment too long.</em>"
    ],
    previewDescription: "Turns an omen suit into one inverted future trick."
  },
  {
    id: "grave-sledge",
    label: "Grave Sledge",
    title: "GRAVE SLEDGE",
    kind: "relic",
    suit: "strength",
    domain: "Relic",
    lines: [
      "Rule: Crush something already dead beneath the head before you wake it.",
      "Effect: In a Strength check, choose a suit. Until the check ends, cards of that suit in your hand are treated as Strength for following suit and winning tricks.",
      "<em>Fiction: What should have needed finesse, timing, or patience can simply be broken through.</em>",
      "Reveal this relic's price after use."
    ],
    previewDescription: "Break through by turning one suit fully into Strength."
  },
  {
    id: "grave-sledge-price",
    label: "Grave Sledge Price",
    title: "GRAVE SLEDGE PRICE",
    kind: "reveal",
    suit: "strength",
    domain: "Reveal After Use",
    lines: [
      "Remove your highest-value Dexterity card from discard.",
      "If there is no Dexterity card there, add 1 Injury and 1 Dazed after the check.",
      "<em>Grave-dust darkens under the skin and your eyes cloud to stone-gray.</em>",
      "<em>Your steps grind like rock and your joints answer slowly.</em>"
    ],
    previewDescription: "Hidden cost and curse to reveal after the sledge answers."
  },
  {
    id: "hushbell-chain",
    label: "Hushbell Chain",
    title: "HUSHBELL CHAIN",
    kind: "relic",
    suit: "dexterity",
    domain: "Relic",
    lines: [
      "Rule: Wind it around wrist or ankle and stand still until you can no longer hear your own movement in the bells.",
      "Effect: For the rest of a Dexterity check, after each trick choose who leads next: you or the open hand.",
      "Each time you do, you may tuck 1 card beneath the chain or return 1 tucked card to hand.",
      "Reveal this relic's price after use."
    ],
    previewDescription: "Steals the next lead and hides motions beneath remembered silence."
  },
  {
    id: "hushbell-chain-price",
    label: "Hushbell Chain Price",
    title: "HUSHBELL CHAIN PRICE",
    kind: "reveal",
    suit: "dexterity",
    domain: "Reveal After Use",
    lines: [
      "At the end of the check, add 1 Dazed for each card still tucked beneath the chain.",
      "<em>The bells remember every hidden motion you leave inside them.</em>",
      "<em>Your footsteps echo a beat late and your voice doubles back on itself.</em>",
      "<em>People hear you arrive before they see you, or hear you answer after you have gone quiet.</em>"
    ],
    previewDescription: "Hidden Dazed cost tied to every card you leave tucked away."
  },
  {
    id: "dead-ledger",
    label: "Dead Ledger",
    title: "DEAD LEDGER",
    kind: "relic",
    suit: "intelligence",
    domain: "Relic",
    lines: [
      "Rule: Write down one true count, debt, promise, or name that matters in the coming trouble.",
      "Effect: At the beginning of a challenge, pull all Stress cards from your deck and discard into your hand.",
      "<em>Fiction: Every burden comes due at once until the whole challenge reads like one terrible sum.</em>",
      "Reveal this relic's price after use."
    ],
    previewDescription: "Calls every Stress card due at once at the start of a challenge."
  },
  {
    id: "dead-ledger-price",
    label: "Dead Ledger Price",
    title: "DEAD LEDGER PRICE",
    kind: "reveal",
    suit: "intelligence",
    domain: "Reveal After Use",
    lines: [
      "At the end of the challenge, if any Stress cards remain in hand, add 1 Injury.",
      "<em>Ink gathers in the nail-beds and tally marks rise at the creases of the skin.</em>",
      "<em>You begin answering with measures, counts, and comparisons before plain language can catch up.</em>",
      "<em>What the ledger totals, it does not let go unpaid.</em>"
    ],
    previewDescription: "Hidden reckoning if any Stress remains in hand at the end."
  },
  {
    id: "wake-lantern",
    label: "Wake Lantern",
    title: "WAKE LANTERN",
    kind: "relic",
    suit: "weird",
    domain: "Relic",
    lines: [
      "Rule: The flame must be taken from a dying breath or kindled before that breath has fully gone cold.",
      "Effect: Invoke a dead hand of 7 reserved cards that does not appear in normal checks. It plays as an additional open hand beside the living one.",
      "Tricks won by the dead hand count as tricks won by you.",
      "Reveal this relic's price after use."
    ],
    previewDescription: "Invokes a dead hand that plays beside the living and wins in your name."
  },
  {
    id: "wake-lantern-price",
    label: "Wake Lantern Price",
    title: "WAKE LANTERN PRICE",
    kind: "reveal",
    suit: "weird",
    domain: "Reveal After Use",
    lines: [
      "For each trick won by the dead hand, gain a status card matching that suit.",
      "<em>Your breath comes out as smoke and the dead can just barely be made out inside it.</em>",
      "<em>Those closest to the invoked dead can no longer remember them clearly.</em>",
      "<em>Names blur, faces slide loose, but grief remains.</em>"
    ],
    previewDescription: "Hidden suit-marking cost and the memory-eating smoke curse."
  }
];

function buildItemConfig(entry) {
  const suit = SUIT_DEFINITIONS[entry.suit];

  return {
    cardClass: entry.kind === "reveal" ? "item-card item-reveal-card" : "item-card",
    cssVars: suit.cssVars,
    value: "",
    itemIconSvgPath: entry.kind === "trinket" ? "../trinklet.svg" : "../relic.svg",
    suitLabel: suit.suitLabel,
    domain: entry.domain,
    title: entry.title,
    lines: entry.lines,
    suitSvgPath: suit.svgPath
  };
}

function buildItemHref(id) {
  return `./${ITEM_PAGE_PATH}?id=${encodeURIComponent(id)}`;
}

function toRuntimeCard(entry) {
  return {
    ...entry,
    file: ITEM_PAGE_PATH,
    params: { id: entry.id },
    config: buildItemConfig(entry)
  };
}

const itemCatalog = ITEM_ENTRIES.map(toRuntimeCard);
const itemCatalogById = new Map(itemCatalog.map((entry) => [entry.id, entry]));

function getItemCardById(id) {
  return itemCatalogById.get(id) || null;
}

function buildItemDeckCards() {
  return itemCatalog.map(({ id, label, suit, file, params }) => ({
    id,
    label,
    suit,
    file,
    params
  }));
}

function buildItemIndexSections() {
  return Object.entries(SECTION_DEFINITIONS).map(([kind, section]) => ({
    ...section,
    cards: itemCatalog
      .filter((entry) => entry.kind === kind)
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        name: entry.label,
        eyebrow: `${SUIT_DEFINITIONS[entry.suit].name} ${entry.kind === "reveal" ? "Reveal" : entry.domain}`,
        description: entry.previewDescription,
        href: buildItemHref(entry.id),
        iframeSrc: buildItemHref(entry.id),
        title: `${entry.label} preview`
      }))
  }));
}

globalThis.TrickItemCatalog = {
  itemCatalog,
  getItemCardById,
  buildItemDeckCards,
  buildItemIndexSections
};
