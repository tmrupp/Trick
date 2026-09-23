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
      "<em>A small splitting wedge of black stone; what it is driven into fails the moment someone else trusts it.</em>",
      "Wake: Drive it by hand into something another will trust with their weight, and leave it there.",
      "Effect: After the deal, wedge 1 world card. If it would win a trick, it wins nothing; decide the trick without it.",
      "Cost: For this check, your highest Strength card in hand counts as half its printed value, rounding down.",
      "<em>You test your weight on everything now.</em>"
    ],
    previewDescription: "Wedge one world card: it holds until the world leans on it, then fails to take the trick."
  },
  {
    id: "grip-bone",
    label: "Grip Bone",
    title: "GRIP BONE",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "<em>A small bone die that rolls whatever number is carved and bleeding on your skin, no matter whose hand throws it.</em>",
      "Wake: Carve a number from 1 to 6 into the back of your hand, then close your fist around the die.",
      "Effect: For this check, your cards of that printed value count as 10.",
      "Cost: Gain 1 Injury.",
      "<em>Everyone can read the number on your hand, and older numbers crisscross beneath it.</em>"
    ],
    previewDescription: "A die loaded to the number bleeding on your hand, and every card of that value hits like a ten."
  },
  {
    id: "iron-apple-seed",
    label: "Iron Apple Seed",
    title: "IRON APPLE SEED",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "<em>A rust-coloured seed, no bigger than a thumbnail, that weighs as much as a full pail.</em>",
      "Wake: Swallow it whole and keep it down.",
      "Effect: The next Strength card you play counts as double its printed value.",
      "Cost: Gain 1 Stumble. Remove this card from the game.",
      "<em>Something in you has settled lower than it was, and your feet drag as you walk.</em>"
    ],
    previewDescription: "Makes one Strength card count double, and leaves you carrying the weight."
  },
  {
    id: "red-thread",
    label: "Red Thread",
    title: "RED THREAD",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "<em>A blood-red thread that, when tugged, drags whatever it holds back to its anchor with the force of the tug.</em>",
      "Wake: Anchor one end to something that will not move, and tie the other around what you want returned.",
      "When: Your approach is Dexterity.",
      "Effect: After the deal, set 1 card aside. Before a lead, tug the thread and take it back into hand. While set aside, it is not in your hand for any purpose, including following suit.",
      "<em>The thread leaves a raw red line on whatever it has held, deeper the farther it was dragged.</em>"
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
      "Wake: Turn it first in the lock you need opened, then turn it in a second lock to trap someone behind it.",
      "Effect: Take 1 card from your discard into hand, then discard 1 card.",
      "Cost: Gain 1 Stumble. The second lock is spoiled with the key caught inside. Recover it by dismantling the lock; to wrench it free instead, gain 1 Injury.",
      "<em>Your hand yearns to wrench the second lock until it fails.</em>"
    ],
    previewDescription: "Trap someone behind one lock to open another, exchanging a card in hand for one you had lost."
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
      "Effect: The holder may speak your name and one word, and you hear it anywhere. During a check, this signal is allowed, and your next played card counts 2 higher.",
      "Cost: Your name burns off the slate. Gain 1 Stress.",
      "<em>While the slate holds your name, you catch yourself listening for it.</em>"
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
      "<em>You can no longer read a book cover to cover; impatience takes you within the first couple of pages.</em>"
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
      "Wake: Whisper a true secret that has never been spoken aloud into the jar, then seal it.",
      "When: Your approach is Weird.",
      "Effect: Before a lead, choose 1 unplayed world card. It counts as Stress for the rest of the check.",
      "Cost: Gain 1 Stress. The secret is heard by everyone nearby, and the jar will not hold it twice.",
      "<em>You poke and prod others to fill the jar with their secrets.</em>"
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
      "Wake: Before anyone arrives, set it to watch a distant spot, and do not leave the scope until drawing begins.",
      "Effect: After the deal, reveal 1 Dexterity card from hand. If you play it on the final trick, it counts 5 higher.",
      "Cost: Gain 1 Stumble.",
      "<em>Your shooting eye waters at anything far away, and your shoulder aches from holding still.</em>"
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
      "Effect: The first trick led in that suit inverts: the lowest card of that suit wins, trump does not apply, and ties go to the latest played.",
      "Cost: At cleanup, gain 1 Curse if that suit never led.",
      "<em>Take the mask off and it becomes difficult to hide whatever you truly feel.</em>"
    ],
    previewDescription: "Steal a true feeling from someone, and one trick runs backwards."
  },
  {
    id: "porters-rope",
    label: "Porter's Rope",
    title: "PORTER'S ROPE",
    kind: "trinket",
    suit: "strength",
    domain: "Trinket",
    lines: [
      "<em>A coarse rope; whatever it hoists weighs nothing if you could carry it unaided.</em>",
      "Wake: Secure it to something you could pick up unaided, even under great strain.",
      "Effect: After a trick you lose with a Strength card, give that Brace to another player instead of taking it; they hold it as their own.",
      "<em>When someone is using the rope, you feel the strain as if it were your own.</em>"
    ],
    previewDescription: "Make a carryable burden weightless, or hand the Brace from your loss to another player."
  },
  {
    id: "still-cricket",
    label: "Still Cricket",
    title: "STILL CRICKET",
    kind: "trinket",
    suit: "dexterity",
    domain: "Trinket",
    lines: [
      "<em>A brass cricket that chirps when staying where you are will bring you harm.</em>",
      "Wake: When it chirps, start moving.",
      "Effect: Before a lead, ask what harm will reach you before the trick ends if you stay where you are. The GM answers briefly and truthfully. If the answer names a harm, you may put 1 card from hand on the bottom of your deck, then draw 1.",
      "Cost: Gain 1 Stumble.",
      "<em>Every silence sounds like the pause before a warning.</em>"
    ],
    previewDescription: "Learn what harm reaches you if you stay put, and trade a card to move before it lands."
  },
  {
    id: "afterimage-lens",
    label: "Afterimage Lens",
    title: "AFTERIMAGE LENS",
    kind: "trinket",
    suit: "intelligence",
    domain: "Trinket",
    lines: [
      "<em>A smoked-glass lens that makes a shard replay one scene its mirror witnessed in the room.</em>",
      "Wake: Shatter an intact mirror that stood in this room during the scene you seek, then hold the lens over its largest shard.",
      "Effect: The GM describes 1 minute from that earlier scene and names 1 detail that still shapes the present. Before drawing, look at the top 3 world cards, put 1 on the bottom of its deck, and return the others in the same order.",
      "Cost: Gain 1 Stress and 1 Curse (compulsion: you may not use mirrors).",
      "<em>Mirrors no longer reflect the present to you, but an indiscernible past.</em>"
    ],
    previewDescription: "Destroy a mirror to recover a scene it witnessed, then use what you learn to alter the approaching world row."
  },
  {
    id: "sin-eaters-spoon",
    label: "Sin Eater's Spoon",
    title: "SIN EATER'S SPOON",
    kind: "trinket",
    suit: "weird",
    domain: "Trinket",
    lines: [
      "<em>A wooden spoon that makes another's suffering yours when you finish the meal meant for them.</em>",
      "Wake: Eat a meal set before someone who is suffering, while they only watch.",
      "Effect: One of their afflictions or burdens passes permanently to you. Between checks, choose 1 status you can gain in another willing player's discard. They return it to reserve; you gain a copy.",
      "<em>Their old pains, habits, and nightmares settle among your own.</em>"
    ],
    previewDescription: "Finish a suffering person's meal to take on one of their statuses: it leaves their discard and a copy enters yours."
  },
  {
    id: "grave-sledge",
    label: "Grave Sledge",
    title: "GRAVE SLEDGE",
    kind: "relic",
    suit: "strength",
    domain: "Relic",
    lines: [
      "<em>A petrified-wood sledge that crushes a skeleton into one bone pin.</em>",
      "Wake: Shatter a named headstone, exhume the corpse, and crush every bone.",
      "Effect: Drive the pin through 2 touching things; nothing can separate them.",
      "If driven during a check, pin 1 ordinary card in hand face up after the deal. For that check only, it stays in hand, and once per trick you may play it, if legal, without moving it.",
      "<em>The pin imbues the joining and the objects it pierces with a bound fate.</em>",
      "Reveal its price."
    ],
    previewDescription: "Makes one irrevocable joining and repeats one ordinary card for a single check."
  },
  {
    id: "grave-sledge-price",
    label: "Grave Sledge Price",
    title: "GRAVE SLEDGE PRICE",
    kind: "reveal",
    suit: "strength",
    domain: "Reveal After Use",
    lines: [
      "Price: When you drive the pin, gain 1 Injury. At cleanup, put the pinned card face down beneath the Sledge, outside your deck. It returns to discard when both joined things are destroyed, and the pin crumbles.",
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
      "Effect: After the deal, set aside every status in hand and take an ordinary card from discard into hand for each, if available. At cleanup, return them to discard in random order before consequence statuses.",
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
      "Price: At cleanup, gain 1 Curse (compulsion: you may not sleep inside).",
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
      "Effect: After any trick but the last, you may ring it. Before the next lead, everyone who hears it, you included, sets 1 card face down; an affected world sets its leftmost. Reveal each on its owner's turn; it is legal, and a follower counts as unable to follow. You may ring it again later.",
      "<em>One bell rings on, and you cannot find it.</em>",
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
      "<em>With each use, each word you speak begins to sound more like the ringing of the bells.</em>"
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
      "<em>A dark leather ledger that makes a creditor forget your debt, and never bargain with you again.</em>",
      "Wake: Write the name of someone you truly owe, then close the ledger before the ink dries.",
      "When: Your approach is Intelligence.",
      "Effect: After the deal, take all Stress from your draw pile and discard into hand. Shuffle the draw pile.",
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
      "<em>A locket broken in half, each half reflecting the face of whoever holds the other.</em>",
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
      "Price: After each exchange, both holders gain 1 Stress, into the pool each now uses, for each mind exchange the locket has caused. This resets when anyone holding the locket dies.",
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
      "Effect: You may ignore follow-suit, counting as unable to follow. Your first off-suit win fulfills your goal; then sit out the rest. Competing goals resolve normally.",
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
      "Effect: Spend 1 charge and make a wish that could have come to pass if you had made a different decision. The GM alters the most recent such decision as little as possible to fulfill it; the wish cannot alter the ring or a Price. After the deal, take your draw pile and discard into hand.",
      "<em>Only you remember the world before the change.</em>",
      "Reveal its price."
    ],
    previewDescription: "Earn a charge by fulfilling a last wish, then undo one of your decisions and take your whole deck into hand."
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
      "<em>An apple the colour of old iron that weighs as much as a laden cart.</em>",
      "Wake: Consume the entire apple in one sitting. Do not stop. Leave nothing but the seeds.",
      "Effect: You permanently grow to twice your height, with strength in proportion. When your approach is Strength, your ordinary Strength cards below 5 count as 5.",
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
      "Price: Gain 1 Injury, 1 Stumble, and 1 Stress. Acquire 4 Iron Apple Seeds, then remove this card from the game.",
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
        backFile: priceCard ? ITEM_PAGE_PATH : "items/item_back.html",
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
