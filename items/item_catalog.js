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
      "<em>A small splitting wedge of black stone. What it is driven into fails the moment it is trusted by someone else.</em>",
      "Wake: Drive it into something wooden, and leave it there.",
      "Effect: Before a lead, choose 1 unplayed world card. When played, halve its printed value, rounding down; it cannot be trump.",
      "Cost: Halve the printed value of your highest Strength card in hand, rounding down.",
      "<em>You test your weight on everything now.</em>"
    ],
    previewDescription: "Set into the world's own footing, so the thing it leans on gives at the moment it leans."
  },
  {
    id: "grip-bone",
    label: "Grip Bone",
    title: "GRIP BONE",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "<em>A small die cut from yellowed bone. It always lands on the face you carved.</em>",
      "Wake: Carve a number from 1 to 6 into the back of your hand, then close your fist around the die. It will roll that number as long as the wound is bleeding freely.",
      "Effect: Name that number before drawing. For this check, your cards of that printed value count as 10.",
      "Cost: Gain 1 Injury.",
      "<em>Everyone can read the number on your hand. Echoes of numbers carved begin to crisscross your hand.</em>"
    ],
    previewDescription: "Name a number before you draw, and every card of that value hits like a ten."
  },
  {
    id: "iron-apple-seed",
    label: "Iron Apple Seed",
    title: "IRON APPLE SEED",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "<em>A seed the colour of rust, no bigger than a thumbnail and heavy as a full pail. It will not crush, it will not mark, and it drags at your pocket all day.</em>",
      "Wake: Swallow it whole.",
      "Effect: Double the printed value of the next Strength card you play.",
      "Cost: Gain 1 Stumble. Remove this card from the game.",
      "<em>Something in you has settled lower than it was, and your feet drag as you walk.</em>"
    ],
    previewDescription: "Doubles one Strength card's printed value, and leaves you carrying the weight."
  },
  {
    id: "red-thread",
    label: "Red Thread",
    title: "RED THREAD",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "<em>A thin blood-red thread, delicate but strong. Anchored at one end and when pulled at the other, it drags whatever it holds back to the anchor with the same force used to tug.</em>",
      "Wake: Anchor one end to something that will not move, and tie the other around what you want returned.",
      "When: Your approach is Dexterity.",
      "Effect: After the deal, set 1 card aside. Before a lead, tug the thread and return it to hand. While set aside, it is not in your hand for any purpose, including following suit.",
      "<em>The thread leaves a raw red line on whatever it has held, and that line does not fade if pulled far.</em>"
    ],
    previewDescription: "Send a card away to open a void, then tug it back when the timing is right."
  },
  {
    id: "crooked-key",
    label: "Crooked Key",
    title: "CROOKED KEY",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "<em>A straight silver key that, after turning in one lock, warps as it enters the next; the second stays shut and the first opens.</em>",
      "Wake: Turn it first in the lock you need opened, then bring it to a second lock holding someone trapped and turn it there.",
      "Effect: Return 1 card from your discard to hand, then discard 1 card.",
      "Cost: Gain 1 Stumble. The second lock is spoiled with the key caught inside. Recover it by dismantling the lock; to wrench it free instead, gain 1 Injury.",
      "<em>When spoiling the second lock, your hand yearns to open it wrenching until it cramps.</em>"
    ],
    previewDescription: "Leave someone trapped behind one lock to open another, exchanging a card in hand for one you had lost."
  },
  {
    id: "slate-shard",
    label: "Slate Shard",
    title: "SLATE SHARD",
    kind: "trinket",
    suit: "intelligence",
    domain: "Trinket",
    lines: [
      "<em>A palm-sized shard of slate, chalk-dusted, with room for a single name.</em>",
      "Wake: Write your name on the slate and put it in someone else's hands.",
      "Effect: Once per check, the holder may speak your name and then one word. You hear it anywhere and it may be during a check. Add 2 to the printed value of your next played card.",
      "Cost: Your name burns off the slate. Gain 1 Stress.",
      "<em>While the slate holds your name, you seem to hear faint whispers of the words spoken before.</em>"
    ],
    previewDescription: "Hand someone a line to you: one word across any distance, and a boost for answering it."
  },
  {
    id: "ripped-page",
    label: "Ripped Page",
    title: "RIPPED PAGE",
    kind: "trinket",
    suit: "intelligence",
    domain: "Trinket",
    lines: [
      "<em>A single blank page, soft with handling, its torn edge matching no book.</em>",
      "Wake: Slip it into a book that would know, and ask a question aloud.",
      "Effect: Before drawing or between checks, the GM answers briefly and truthfully within what that book could know. Then look at the top 3 cards of your deck, reorder them, and discard any you choose.",
      "Cost: Gain 1 Stress. Asking the question unwrites the book, leaving it blank forever.",
      "<em>You can't seem to read any book cover to cover anymore, your impatience always mounts.</em>"
    ],
    previewDescription: "Ask a book what it knows, then rearrange what you are about to draw."
  },
  {
    id: "whisper-jar",
    label: "Whisper Jar",
    title: "WHISPER JAR",
    kind: "trinket",
    suit: "weird",
    domain: "Trinket",
    lines: [
      "<em>A jar filled with whispered secrets, whirring softly.</em>",
      "Wake: Whisper a true secret you have never spoken aloud into the jar, then seal it.",
      "When: Your approach is Weird.",
      "Effect: Before a lead, choose 1 unplayed world card. It counts as Stress for the rest of the check.",
      "Cost: Gain 1 Stress. The secret is heard by everyone nearby, and the jar will not hold it twice.",
      "<em>When opened, people glance over their shoulders as if someone spoke behind them.</em>"
    ],
    previewDescription: "Silences the world's best card, paid for with a secret you cannot take back."
  },
  {
    id: "scoped-rifle",
    label: "Scoped Rifle",
    title: "SCOPED RIFLE",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "<em>A long rifle with a scope, set up hours before anyone arrives.</em>",
      "Wake: Set it to watch a distant spot and look through the scope until drawing begins.",
      "Effect: After the deal, reveal 1 Dexterity card from hand. If you play it on the final trick, add 5 to its printed value.",
      "Cost: Gain 1 Stumble.",
      "<em>Sometimes the lens appears smoky and unusable. Training it steadily for long makes your joint ache and stiff.</em>"
    ],
    previewDescription: "Reveal a card and hold it to the last trick, where it lands five higher."
  },
  {
    id: "borrowed-face",
    label: "Borrowed Face",
    title: "BORROWED FACE",
    kind: "trinket",
    suit: "weird",
    domain: "Trinket",
    lines: [
      "<em>A blank mask, smooth as a river stone, with no expression of its own.</em>",
      "Wake: Peer deeply into someone's eyes. The mask takes their true feeling and wears it; the GM names its suit.",
      "When: Your approach is Weird.",
      "Effect: The first trick led in that suit inverts: lowest card wins, trump does not apply, ties go to the non-led suit then the latest played.",
      "Cost: Gain 1 Curse if that suit never leads.",
      "<em>Take the mask off and it becomes difficult to hide whatever you truly feel.</em>"
    ],
    previewDescription: "Steal a true feeling from someone, and one trick runs backwards."
  },
  {
    id: "grave-sledge",
    label: "Grave Sledge",
    title: "GRAVE SLEDGE",
    kind: "relic",
    suit: "strength",
    domain: "Relic",
    lines: [
      "<em>A petrified-wood sledge. A crushed skeleton leaves one bone pin.</em>",
      "Wake: Shatter a headstone, exhume the named corpse, and crush every bone.",
      "Effect: Drive the pin through 2 touching things. It cannot be removed; separating them requires destroying both. The sledge cannot wake while it remains.",
      "In a check, pin 1 ordinary card from hand face up after drawing. It remains in hand for following suit. Once per trick, if legal, play it without moving it.",
      "<em>The same blow lands again and again.</em>",
      "Reveal its price."
    ],
    previewDescription: "Makes one irrevocable joining and repeats one ordinary card for as long as the check lasts."
  },
  {
    id: "grave-sledge-price",
    label: "Grave Sledge Price",
    title: "GRAVE SLEDGE PRICE",
    kind: "reveal",
    suit: "strength",
    domain: "Reveal After Use",
    lines: [
      "Price: When you drive the pin, gain 1 Injury. At cleanup, leave the pinned card beneath the Sledge, outside your deck. It returns to discard only when both joined things are destroyed; then the bone pin crumbles.",
      "<em>The sledge and pin yield nothing to the blow. Your body does.</em>",
      "<em>The pin keeps the action that set it. Until the joining is destroyed, it will not give that action back.</em>"
    ],
    previewDescription: "The blow causes an Injury and keeps the repeated card until both joined things are destroyed."
  },
  {
    id: "hearthhide-coat",
    label: "Hearthhide Coat",
    title: "HEARTHHIDE COAT",
    kind: "relic",
    suit: "strength",
    domain: "Relic",
    lines: [
      "<em>A coat of scarred hide; beneath it, cold, pain, and exhaustion cannot reach you.</em>",
      "Wake: Sleep in it without fire or roof until you stop shaking.",
      "When: Your approach is Strength.",
      "Effect: After the deal, set aside every status in hand and replace each with an ordinary card from discard, if available. At cleanup, return them to discard in random order before consequence statuses. The recorded survival cost never changes.",
      "<em>The cold stops reaching you, and so does everything else.</em>",
      "Reveal its price."
    ],
    previewDescription: "Forces every status out of a Strength hand and replaces it from discard, while the coat binds itself deeper."
  },
  {
    id: "hearthhide-coat-price",
    label: "Hearthhide Coat Price",
    title: "HEARTHHIDE COAT PRICE",
    kind: "reveal",
    suit: "strength",
    domain: "Reveal After Use",
    lines: [
      "Price: At cleanup, gain 1 Curse. If you had none, record its compulsion: you may not sleep inside.",
      "Price: To remove the coat, gain 1 Injury for each Curse not in your reserve.",
      "<em>The coat grows into you at the collar, cuffs, and every place your skin has broken.</em>",
      "<em>Removing it tears away whatever has grown through the hide.</em>"
    ],
    previewDescription: "Each use adds a Curse; removing the coat tears deeper with every Curse you carry."
  },
  {
    id: "hushbell-chain",
    label: "Hushbell Chain",
    title: "HUSHBELL CHAIN",
    kind: "relic",
    suit: "dexterity",
    domain: "Relic",
    lines: [
      "<em>A brass bell-chain; anyone who hears it hears nothing else until it stops.</em>",
      "Wake: Ring it while people in earshot listen for something else.",
      "When: Your approach is Dexterity.",
      "Effect: After a trick but the last, you may ring the chain. Before the next lead, everyone who hears it sets 1 card face down; an affected world sets its leftmost. Reveal each on its owner's turn. It is legal, and a follower counts as unable to follow suit. This repeats.",
      "<em>Afterward, voices reach you as movement without sound.</em>",
      "Reveal its price."
    ],
    previewDescription: "Makes everyone who hears it commit a card before the next lead, deaf to every other play."
  },
  {
    id: "hushbell-chain-price",
    label: "Hushbell Chain Price",
    title: "HUSHBELL CHAIN PRICE",
    kind: "reveal",
    suit: "dexterity",
    domain: "Reveal After Use",
    lines: [
      "Price: At cleanup, gain 1 Stumble for each time you rang the chain.",
      "<em>Your footsteps begin to ring like small bells, then sometimes make no sound at all.</em>",
      "<em>With each use, more of your speech becomes ringing or silence.</em>"
    ],
    previewDescription: "Each ringing costs Stumble as your footsteps and speech become bells or vanish into silence."
  },
  {
    id: "dead-ledger",
    label: "Dead Ledger",
    title: "DEAD LEDGER",
    kind: "relic",
    suit: "intelligence",
    domain: "Relic",
    lines: [
      "<em>A dark leather ledger; write the name of someone you owe, and they forget the debt but will never bargain with you again.</em>",
      "Wake: Write the name of someone you truly owe, then close the ledger before the ink dries.",
      "When: Your approach is Intelligence.",
      "Effect: After the deal, take all Stress from your draw pile and discard into hand. This is not drawing, so Stress does not duplicate. Shuffle the draw pile.",
      "<em>You remember every erased debt in the creditor's voice.</em>",
      "Reveal its price."
    ],
    previewDescription: "Erases a real debt and every future bargain with its creditor, then calls accumulated Stress into your hand."
  },
  {
    id: "dead-ledger-price",
    label: "Dead Ledger Price",
    title: "DEAD LEDGER PRICE",
    kind: "reveal",
    suit: "intelligence",
    domain: "Reveal After Use",
    lines: [
      "Price: At cleanup, gain 1 Injury if any Stress remains in hand.",
      "<em>Every debt erased from another's memory remains written beneath your name.</em>",
      "<em>Your fingertips darken, and every promise sounds like a sum being read aloud.</em>"
    ],
    previewDescription: "An erased debt remains with the ledger's holder, and any balance left in hand draws blood."
  },
  {
    id: "wake-lantern",
    label: "Wake Lantern",
    title: "WAKE LANTERN",
    kind: "relic",
    suit: "weird",
    domain: "Relic",
    lines: [
      "<em>A blackened brass lantern whose cold flame gives a captured spirit form.</em>",
      "Wake: With no cards tucked, catch a final breath in its chimney or coax in a lingering spirit. Tuck the top 7 world cards face up beneath it, outside the deck until invoked.",
      "Effect: Before drawing, move the tucked cards into a dead-hand row. It sits after you, follows the world's rule, uses your personal trump, and scores its wins for your goal. It may lead. When empty, it sits out and the world leads in its place.",
      "<em>The spirit stands beside you, aiding your work with the skills they carried in life.</em>",
      "Reveal its price."
    ],
    previewDescription: "Gives a dead spirit spectral form and a seven-card hand held out of the world deck until invoked."
  },
  {
    id: "wake-lantern-price",
    label: "Wake Lantern Price",
    title: "WAKE LANTERN PRICE",
    kind: "reveal",
    suit: "weird",
    domain: "Reveal After Use",
    lines: [
      "Price: At cleanup, for each dead-hand card, move an ordinary card of the same suit and printed value from your reserve to your discard, if available, then return the dead hand to the world deck. For each trick it won, gain 1 status matching the printed suit of its winning card.",
      "Price: At cleanup, every living person but you forgets the invoked dead. Their spirit remains within you and cannot pass on until you die.",
      "<em>Their belongings, likenesses, and written records remain, belonging to someone no one remembers.</em>",
      "<em>Sometimes you hear their voice among your thoughts.</em>"
    ],
    previewDescription: "The spirit joins your deck and remains within you while every other living person forgets them."
  },
  {
    id: "halved-locket",
    label: "Halved Locket",
    title: "HALVED LOCKET",
    kind: "relic",
    suit: "intelligence",
    domain: "Relic",
    lines: [
      "<em>A locket broken in half. Each half reflects the face of whoever holds the other.</em>",
      "Wake: At the same moment, each holder grips a half over their heart and holds it until both grow hot.",
      "Effect: Between checks, the holders exchange minds. Each mind uses the other body's complete personal card pool, including reserve and discard. If a body has none, the GM builds one before the exchange. Repeat the Wake to exchange them again.",
      "<em>Your borrowed body reaches for what it loves and recoils from what it fears before you know why.</em>",
      "Reveal its price."
    ],
    previewDescription: "Remotely exchanges two minds, leaving each to live through the other's body and card pool."
  },
  {
    id: "halved-locket-price",
    label: "Halved Locket Price",
    title: "HALVED LOCKET PRICE",
    kind: "reveal",
    suit: "intelligence",
    domain: "Reveal After Use",
    lines: [
      "Price: Both holders gain 1 Stress for each mind exchange the locket has caused.",
      "<em>Each exchange leaves habits, memories, and desires behind in the body you leave.</em>",
      "<em>With every return, your body recognizes you less readily.</em>"
    ],
    previewDescription: "Both minds gain mounting Stress while their bodies retain traces of everyone who inhabited them."
  },
  {
    id: "hollow-blindfold",
    label: "Hollow Blindfold",
    title: "HOLLOW BLINDFOLD",
    kind: "relic",
    suit: "dexterity",
    domain: "Relic",
    lines: [
      "<em>A seamless linen blindfold dusted with pollen from no living flower.</em>",
      "Wake: Face a built barrier, put it on, and walk forward without reaching for it. Do not remove it until you mean to return.",
      "When: Your approach is Dexterity.",
      "Effect: You may ignore follow-suit, counting as unable, so personal trump stays live. Your first off-suit win raises your goal score to at least its cost; then sit out the rest. Competing goals resolve normally.",
      "<em>Behind the cloth, the air is hot and wet, and the ground has never known a road.</em>",
      "Reveal its price."
    ],
    previewDescription: "Walks around human barriers through an older world; an off-suit win fulfills your goal, then you step out of the check."
  },
  {
    id: "hollow-blindfold-price",
    label: "Hollow Blindfold Price",
    title: "HOLLOW BLINDFOLD PRICE",
    kind: "reveal",
    suit: "dexterity",
    domain: "Reveal After Use",
    lines: [
      "Price: Your next check is a lone 7-trick Dexterity check against the world to remove the blindfold and return safely. Your goal costs 3. You return whether you succeed or fail.",
      "Price: On failure, the GM chooses what fits your return: you appear partly inside something solid and gain 2 Injuries, or a creature follows you back.",
      "<em>The land is familiar, but no human hand has touched it.</em>",
      "<em>You sense that hungry beasts roam this place, and some are patient enough to follow you back.</em>"
    ],
    previewDescription: "A lone 3-of-7 return through an untouched world, risking solid matter or a living follower."
  },
  {
    id: "dying-ring",
    label: "Dying Ring",
    title: "DYING RING",
    kind: "relic",
    suit: "weird",
    domain: "Relic",
    lines: [
      "<em>A dark ring that frosts the wearer's breath while charged.</em>",
      "Wake: Hold it to dying lips for their last wish. Fulfill it after they die; the ring gains 1 charge.",
      "Effect: Spend 1 charge and wish about 1 person, object, or place here. The GM makes the smallest present change that fulfills it; it cannot alter the ring or a Price. After the deal, also shuffle and discard your hand, discard your draw pile top first, then take N cards from discard as your new hand.",
      "<em>Everyone remembers the change, but not a world before it.</em>",
      "Reveal its price."
    ],
    previewDescription: "Earn a charge by fulfilling a last wish, then spend it to change one present fact and rebuild your hand."
  },
  {
    id: "dying-ring-price",
    label: "Dying Ring Price",
    title: "DYING RING PRICE",
    kind: "reveal",
    suit: "weird",
    domain: "Reveal After Use",
    lines: [
      "Price: At cleanup, gain 3 Injuries.",
      "<em>It was your dying wish.</em>",
      "<em>Your breath shortens and your skin grows cold.</em>"
    ],
    previewDescription: "The ring grants the wish by treating it as your last, leaving three Injuries behind."
  },
  {
    id: "iron-apple",
    label: "Iron Apple",
    title: "IRON APPLE",
    kind: "relic",
    suit: "strength",
    domain: "Relic",
    lines: [
      "<em>An apple the colour and weight of old iron, slightly too heavy to be fruit.</em>",
      "Wake: Consume the entire apple in one sitting. Do not stop. Leave nothing but the seeds.",
      "Effect: You permanently grow to twice your height, with strength in proportion. When your approach is Strength, your Strength cards below 5 count as 5 when determining the trick winner.",
      "<em>You can no longer make yourself small, light, or gentle.</em>",
      "Reveal its price."
    ],
    previewDescription: "Permanently doubles your height and raises every low Strength play to 5."
  },
  {
    id: "iron-apple-price",
    label: "Iron Apple Price",
    title: "IRON APPLE PRICE",
    kind: "reveal",
    suit: "strength",
    domain: "Reveal After Use",
    lines: [
      "Price: Gain 1 Injury, 1 Stumble, 1 Stress, and 4 Iron Apple Seeds, then remove this card from the game.",
      "<em>Your bones split and lengthen. Your skin closes only after the growth is done.</em>",
      "<em>Nothing made to hold you fits, and nothing made to bear you was built for your weight.</em>"
    ],
    previewDescription: "The growth wounds body, balance, and mind, leaving four iron seeds behind."
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
