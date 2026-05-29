const ITEM_PAGE_PATH = "items/item_card.html";

// item that allows you to see the other side of a relic

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
      "<em>A hatchet with a head of black stone, heavy and cold.</em>",
      "Rule: Drive it into wood, before the work starts.",
      "Effect: In a Strength check, draw 1 extra card before the first trick.",
      "Cost: On the next trick, you must play your highest valid card.",
      "<em>Your palm stays soot-dark until the check ends.</em>"
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
      "<em>A small knuckle bone, wrapped in thin wire.</em>",
      "Rule: Clench it before the check starts.",
      "Effect: In a Strength check, discard 1 and draw 1; if the new card is Strength, draw 1 more and keep it.",
      "Cost: If you use it, you cannot choose your consolation when you lose the next trick.",
      "<em>That hand cramps and trembles whenever you try anything delicate.</em>"
    ],
    previewDescription: "Turns a hard grip into better Strength finds at the cost of control."
  },
  {
    id: "iron-apple-seed",
    label: "Iron Apple Seed",
    title: "IRON APPLE SEED",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "<em>A seed the color of rust, hard as a nail, impossible to crush between the fingers. Perhaps you could plant it.</em>",
      "Rule: Swallow it whole.",
      "Effect: In a Strength check, double the value of the next strength card you play.",
      "Cost: Add 1 Dazed to your discard after the check. Remove this card from the game.",
      "<em>You feel taller when the check begins. The feeling does not fully leave.</em>"
    ],
    previewDescription: "Double one Strength card's value for a trick, at the cost of an Injury."
  },
  {
    id: "red-thread",
    label: "Red Thread",
    title: "RED THREAD",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "<em>A thin blood red thread, delicate but strong.</em>",
      "Rule: Tie it around a finger or wrist before the check starts.",
      "Effect: In a Dexterity check, set 1 card aside face down. At a later trick, return it to hand.",
      "Cost: When the tucked card comes back, you must discard 1 card.",
      "<em>The thread leaves a raw red line behind that never seems to fully heal.</em>"
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
      "<em>A dull silver key, bent too badly to fit in any lock.</em>",
      "Rule: Place it inside a real lock.",
      "Effect: In a Dexterity check, after either side leads a trick, draw 1 card.",
      "Play it instead of a card from hand if valid for that trick; otherwise discard it immediately.",
      "Price: None.",
      "<em>Afterward the used lock is spoiled and will not work again.</em>",
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
      "<em>A small shard of slate worn with etchings.</em>",
      "Rule: Scratch it with a fingernail during a check.",
      "Effect: In an Intelligence check, look at the top 2 cards of your deck, reorder them, then draw 1.",
      "Cost: Discard 1 card from your hand.",
      "<em>The shards show your marks clear as chalk until you look away.</em>"
    ],
    previewDescription: "A planning shard that trades a card for cleaner future draws."
  },
  {
    id: "ripped-page",
    label: "Ripped Page",
    title: "RIPPED PAGE",
    kind: "trinket",
    suit: "intelligence",
    domain: "Trinket",
    lines: [
      "<em>A small page, worn and fragile.</em>",
      "Rule: Charge it by reading a new word before the check starts.",
      "Effect: At the beginning of a challenge, look at the open hand and move 1 card to a different position.",
      "Cost: None",
      "<em>The words ring in your mind, guiding your actions.</em>"
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
      "<em>A jar filled with whispered secrets whirring softly.</em>",
      "Rule: Whisper a true secret that has never been uttered aloud into the jar and seal it with your thumb.",
      "Effect: Open it in a check and choose 1 card in the opposing hand; that card is treated as Stress for the rest of the check.",
      "Cost: The secret is heard by everyone nearby and the jar cannot hold that secret again.",
      "<em>When opened people glance over their shoulders as if someone just spoke behind them.</em>"
    ],
    previewDescription: "Lets one true secret out into the room and stains a chosen opposing card with Stress."
  },
  {
    id: "scoped-rifle",
    label: "Scoped Rifle",
    title: "SCOPED RIFLE",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "<em>A long rifle with a scope.</em>",
      "Rule: Set it up to watch a distant spot and look through the scope until the check starts.",
      "Effect: In a Dexterity check, add 2 to the value of a card in your hand for the rest of the check.",
      "Cost: Discard 1 card from your hand.",
      "<em>Sometimes the lens appears smoky and unusable.</em>"
    ],
    previewDescription: "Lets one true secret out into the room and stains a chosen opposing card with Stress."
  },
  {
    id: "borrowed-face",
    label: "Borrowed Face",
    title: "BORROWED FACE",
    kind: "trinket",
    suit: "weird",
    domain: "Trinket",
    lines: [
      "<em>A mask with an expression that seems to shift with your thoughts.</em>",
      "Rule: Wear it during a check and let it settle on an expression.",
      "Effect: In a Weird check, flip an omen card. The first trick led with that omen suit has its winner inverted.",
      "Cost: If no trick is led with that suit before the check ends, add 1 Stress after the check.",
      "<em>Mirrors and still water show you wearing the wrong expression a moment too long even after the mask is removed.</em>"
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
      "<em>A small carpenter's hammer, made of petrified wood.</em>",
      "Rule: Crush something already dead beneath the head before you wake it.",
      "Effect: In a Strength check, choose a suit. Until the check ends, cards of that suit in your hand are treated as Strength for following suit and winning tricks.",
      "<em>What should have needed finesse, timing, or patience can simply be broken through.</em>",
      "Flip after using."
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
    id: "hearthhide-coat",
    label: "Hearthhide Coat",
    title: "HEARTHHIDE COAT",
    kind: "relic",
    suit: "strength",
    domain: "Relic",
    lines: [
      "<em>A coat made from the hide of an unknown creature that endured the harshest winters.</em>",
      "Rule: Sleep in it without fire or roof until your body stops shaking.",
      "Effect: Once in a survival check, set aside up to 2 Injury cards from your hand. They do not count as being in hand until the check ends.",
      "Take 2 cards from your discard into your hand for each Injury set aside this way.",
      "Flip after using."
    ],
    previewDescription: "Temporarily buries Injury pressure in a survival check by teaching the body to endure too much."
  },
  {
    id: "hearthhide-coat-price",
    label: "Hearthhide Coat Price",
    title: "HEARTHHIDE COAT PRICE",
    kind: "reveal",
    suit: "strength",
    domain: "Reveal After Use",
    lines: [
      "At the end of the check, return those Injuries to your discard.",
      "Add 1 Dazed for each Injury set aside this way. If you set aside 2, also add 1 Stress.",
      "<em>Your skin pales and deadens and with continued use the coat becomes harder to take off, becoming a part of you.</em>",
      "<em>People can see the places where the coat had to be rended from your flesh.</em>"
    ],
    previewDescription: "Hidden cost for surviving by deadening the body's warnings."
  },
  {
    id: "hushbell-chain",
    label: "Hushbell Chain",
    title: "HUSHBELL CHAIN",
    kind: "relic",
    suit: "dexterity",
    domain: "Relic",
    lines: [
      "<em>A length of thin chain strung with small bells that seem to ring before it is shaken.</em>",
      "Rule: Wind it around wrist or ankle and stand still until you can no longer hear your own movement in the bells.",
      "Effect: For the rest of a Dexterity check, after each trick choose who leads next: you or the open hand.",
      "Each time you do, you may tuck 1 card beneath the chain or return 1 tucked card to hand.",
      "Flip after using."
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
      "<em>Your footsteps echo a beat late or early and your voice doubles back on itself.</em>",
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
      "<em>A large ledger bound in dark leather, its pages filled with meticulous scrawlings.</em>",
      "Rule: Write down one count, debt, promise, or name that matters in the coming trouble, getting it wrong has consequences.",
      "Effect: At the beginning of a challenge, pull all Stress cards from your deck and discard into your hand.",
      "<em>Every burden comes due at once until the whole challenge reads like one terrible sum.</em>",
      "Flip after using."
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
      "<em>Ink gathers in the nail-beds and previous sums haunt your thoughts.</em>",
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
      "<em>A lantern that burns with a cold blue flame, its light dim and flickering.</em>",
      "Rule: The flame must be lit from a dying breath, or from a spirit that has not managed to yet escape.",
      "Effect: Invoke a dead hand of 7 reserved cards that does not appear in normal checks. It plays as an additional open hand beside the living one.",
      "Tricks won by the dead hand count as tricks won by you.",
      "Flip after using."
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
      "For each trick won by the dead hand, gain a status card matching that suit once per suit.",
      "<em>After use your breath comes out as smoke and the dead can just barely be made out inside it.</em>",
      "<em>Those closest to the invoked dead can no longer remember them clearly.</em>",
      "<em>Names blur, faces slide loose, but grief remains.</em>"
    ],
    previewDescription: "Hidden suit-marking cost and the memory-eating smoke curse."
  },
  {
    id: "halved-locket",
    label: "Halved Locket",
    title: "HALVED LOCKET",
    kind: "relic",
    suit: "intelligence",
    domain: "Relic",
    lines: [
      "<em>A locket broken in half, each of its halves must be possessed by a different user.</em>",
      "Rule: The locket half is gripped causing the other to radiate in a heat that grow more intense with time. Grip the other half at the same time to swap minds.",
      "Effect: The users swap hands and decks until the locket is linked again.",
      "Flip after using."
    ],
    previewDescription: "Users swap hands and decks until the locket is linked again."
  },
  {
    id: "halved-locket-price",
    label: "Halved Locket Price",
    title: "HALVED LOCKET PRICE",
    kind: "reveal",
    suit: "intelligence",
    domain: "Reveal After Use",
    lines: [
      "Gain a stress for each time the locket has been used to swap minds.",
      "<em>With each switch your mind struggles to come to terms with its new vessel.</em>",
      "<em>The body yearns to hold onto its current mind and resists the change more ferociously with each use.</em>",
    ],
    previewDescription: "Hidden suit-marking cost and the memory-eating smoke curse."
  },
  {
    id: "hollow-blindfold",
    label: "Hollow Blindfold",
    title: "HOLLOW BLINDFOLD",
    kind: "relic",
    suit: "dexterity",
    domain: "Relic",
    lines: [
      "<em>A blindfold of undyed linen. There is no seam anywhere on it.</em>",
      "Rule: Put it on. Do not remove it until you are sure you are standing somewhere safe.",
      "Effect: In a Dexterity check, you are not required to follow the led suit. If you win a trick without following suit, you win the challenge entirely.",
      "Flip after using."
    ],
    previewDescription: "Step through walls by winning one trick without playing a card."
  },
  {
    id: "hollow-blindfold-price",
    label: "Hollow Blindfold Price",
    title: "HOLLOW BLINDFOLD PRICE",
    kind: "reveal",
    suit: "dexterity",
    domain: "Reveal After Use",
    lines: [
      "Perform a Dexterity 3 check without consolations. On a failure, add 2 Injuries and 1 Dazed, you have come back to the world of edifice wrong.",
      "<em>The land you travel through feels familiar but untouched by working hands.</em>",
      "<em>There are creatures here that are quiet and hungry, some may be patient enough to follow you home.</em>"
    ],
    previewDescription: "A following thing and a binding Curse: never bare-faced inside buildings."
  },
  {
    id: "dying-ring",
    label: "Dying Ring",
    title: "DYING RING",
    kind: "relic",
    suit: "weird",
    domain: "Relic",
    lines: [
      "<em>A plain band of dark metal, always slightly cold against living skin.</em>",
      "Rule: Charge it by holding it against the lips of someone dying while their last wish is spoken aloud and making sure it comes to pass.",
      "Effect: Spend a charge. Discard your hand and deck. Pick 7 cards from your discard to put into your hand.",
      "<em>Once charged a user's spoken wish will come true, but with terrible consequences.</em>",
      "Flip after using."
    ],
    previewDescription: "Pull any named card from your deck or discard, paid for with a dying wish."
  },
  {
    id: "dying-ring-price",
    label: "Dying Ring Price",
    title: "DYING RING PRICE",
    kind: "reveal",
    suit: "weird",
    domain: "Reveal After Use",
    lines: [
      "Place 3 curses with \"Remove on death.\" into the user's discard. Trigger a survival check.",
      "<em>It was your dying wish.</em>",
      "<em>You begin to feel terribly cold and you had so many more wishes you want to come to pass.</em>"
    ],
    previewDescription: "A death, a Curse, and a compulsion to keep listening for the dying."
  },
  {
    id: "iron-apple",
    label: "Iron Apple",
    title: "IRON APPLE",
    kind: "relic",
    suit: "strength",
    domain: "Relic",
    lines: [
      "<em>An apple the color and weight of old iron, slightly too heavy to be fruit.</em>",
      "Rule: Consume the entire apple in one sitting. Do not stop. Leave nothing but the seeds behind.",
      "Effect: In all future Strength checks, treat all your Strength cards as having double their printed value for every trick.",
      "<em>It hurts to grow.</em>",
      "Flip after using."
    ],
    previewDescription: "Double all Strength card values for a challenge, then grow permanently."
  },
  {
    id: "iron-apple-price",
    label: "Iron Apple Price",
    title: "IRON APPLE PRICE",
    kind: "reveal",
    suit: "strength",
    domain: "Reveal After Use",
    lines: [
      "Add 3 injuries to your discard. Gain 4 Iron Apple Seeds, and remove this card from the game.",
      "<em>You do not grow back. Every doorframe is a problem now.</em>",
      "<em>What was built for your old size is built wrong.</em>",
      "<em>The seeds survived intact. With patience and the right soil, another apple might grow. And so might you.</em>"
    ],
    previewDescription: "Permanent growth: 3 Injuries and 4 Iron Apple Seeds."
  },
];

function buildItemConfig(entry) {
  const suit = SUIT_DEFINITIONS[entry.suit];
  const cardClass = ["item-card"];

  if (entry.kind === "relic") {
    cardClass.push("item-relic-card");
  }

  if (entry.kind === "reveal") {
    cardClass.push("item-reveal-card");
  }

  return {
    cardClass: cardClass.join(" "),
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

function getPriceCardForRelic(id) {
  return itemCatalogById.get(`${id}-price`) || null;
}

function buildItemDeckCards() {
  return itemCatalog
    .filter((entry) => entry.kind !== "reveal")
    .map(({ id, label, suit, kind, file, params }) => {
      const priceCard = kind === "relic" ? getPriceCardForRelic(id) : null;

      return {
        id,
        label,
        suit,
        kind,
        file,
        params,
        backFile: priceCard ? ITEM_PAGE_PATH : "card_back.html",
        backParams: priceCard ? { id: priceCard.id } : {}
      };
    });
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
