# Items in TRICK: Rich Item State, Reusable Primitives, and GM Quick-Actions

A plan for bringing all 23 items in [items/item_catalog.js](../../items/item_catalog.js) (14 Trinkets and 9 Relics with hidden Reveal Price cards) — plus homebrew items and the 6 optional peoples in [races/race_catalog.js](../../races/race_catalog.js) — cleanly into the TRICK web suite.

Like [PLAN.md](PLAN.md), the goal is to keep `game/engine/` small, readable, and faithful to [RULES.md](../../RULES.md): the GM adjudicates the fiction (*Wake* conditions, narrative timing, unusual collisions), while the software handles every card move, hidden reveal, and calculation smoothly.

---

## Why Not Hardcode 23 Item Rules?

Almost every TRICK item mixes a **fictional trigger** (*"Drive it by hand into something another will trust with their weight"*, *"Shatter a named headstone"*, *"Eat a meal set before someone who is suffering"*) with a **rule-bending card effect** (inverting a trick, pinning a repeating card, peeking top 3 of the world deck, deafening allies into random plays, swapping entire card pools).

Hardcoding 23 bespoke item state machines inside `check.mjs` would:
- bloat core trick resolution with one-off hooks and interaction bugs when two Relics collide;
- take fictional timing out of the GM's hands;
- make adding new or homebrew items require engine code changes.

Instead, we build **three clean, orthogonal layers**:

1. **Rich Item Instances & Relic Price Reveals** — upgrade `ch.items` from bare strings to structured instances with charges/quantities, hidden Relic Prices, and homebrew text items.
2. **Five Reusable Engine Primitives** — small, general-purpose card/check verbs (following `AGENTS.md`: *GM tools first*, *one path per card move*, *hidden info through `viewFor`*) that cover ~90% of all 23 items and all 6 peoples.
3. **GM Quick-Action Recipes** — when a player clicks **Use** on an item, the GM sees the item's *Wake / When / Effect / Cost* inline alongside 1–2 shortcut buttons wired purely to those primitives.

---

## Layer 1: Rich Item Instances & Relic Price Reveals

### What's broken or missing today
- `ch.items` is a flat array of unique catalog IDs (`["black-wedge"]`), so characters cannot hold multiples (*4× Iron Apple Seed*) or track counters (*Dying Ring* charges, *Hushbell Chain* rings, *Halved Locket* exchanges).
- `itemsById()` in `client.js` filters out `kind === "reveal"`, so **Relic Price cards cannot be viewed or revealed anywhere in the app**.
- GMs cannot hand out ad-hoc/homebrew campaign items without editing `item_catalog.js`.

### Data model

Replace `ch.items: string[]` with an array of plain-data item instances:

```js
// Catalog item (Trinket or Relic)
{
  id: "it-1",               // unique per character instance (monotonic counter on ch)
  itemId: "dying-ring",     // key in items/item_catalog.js, or null for custom items
  revealed: false,          // for Relics: whether the *-price card has been revealed to the player/table
  qty: 1,                   // stack count for consumables (e.g. 4 Iron Apple Seeds)
  charges: 0,               // general-purpose counter (charges, rings, exchanges)
  note: "",                 // optional GM/player note (e.g. carved number "3", named suit "Weird", joined objects)
  tucked: [],               // optional card IDs tucked beneath an item (e.g. Wake Lantern's 7 world cards, Grave Sledge's pinned card)
}

// Custom / homebrew item (itemId: null)
{
  id: "it-2",
  itemId: null,
  label: "Salt-Crusted Compass",
  text: "Wake: … Effect: … Cost: …",
  revealed: true,
  qty: 1,
  charges: 0,
  note: "",
  tucked: [],
}
```

### Engine actions (`campaign.mjs`)

| Action | Who | Behavior |
| --- | --- | --- |
| `giveItem { charId, itemId, label?, text?, qty = 1, charges = 0, note? }` | GM | Adds a new item instance (or increments `qty` if stacking a consumable like `iron-apple-seed`). Relics start with `revealed: false`. |
| `loseItem { charId, instanceId, qty? }` | GM | Decrements `qty` or removes the item instance. |
| `updateItem { charId, instanceId, qty?, charges?, note? }` | GM | Updates counters/notes (e.g., `+1 charge` on *Dying Ring*, setting the carved value on *Grip Bone*, or noting the named suit on *Borrowed Face*). |
| `revealItemPrice { charId, instanceId }` | GM | Flips `revealed: true` on a Relic and emits `itemPriceRevealed` (logged in journal, shown in a reveal banner/toast to the table). |
| `useItem { charId, instanceId, note? }` | Player or GM | Announces item activation (`itemUsed`) with optional player note (e.g., which word was spoken on *Slate Shard*, which card is targeted). |

### Hidden information (`views.mjs`)
- **GM view:** sees every item instance plus its catalog front **and** hidden `*-price` text (tagged `Price hidden` until revealed).
- **Player & Table views:** see `itemId`, `label`, `qty`, `charges`, `note`, and `revealed`. When `revealed: false`, the `*-price` card text is **never shown** (only `"Reveal its price."`). Once `revealed: true`, the player's **My cards** sheet and zoomed item card display the full Price card.

---

## Layer 2: Five Reusable Engine Primitives

All five primitives are **GM tools first** (matching `AGENTS.md`), use the existing card-movement helpers (`placeCard`, `moveCard`, `takeFromReserve`), and leave core `resolveTrick()` clean and predictable.

### Primitive 1: Peek & Reorder Top N (`deck` or `worldDeck`)
Unlocks: **Ripped Page** (top 3 of own deck: reorder + discard any), **Afterimage Lens** (top 3 of world deck: swap 1 with a card in the world row).

- **Engine actions:**
  - `gmPeekDeck { charId, n = 3, allowDiscard = true }` — pushes a private pending prompt `{ type: "peekDeck", charId, cards: topNIds, allowDiscard }` (valid between checks or during `play`/`consolation`).
  - `resolvePeekDeck { charId, keepOrder: cardId[], discard: cardId[] }` — validates the union equals `topNIds`, moves `discard` via `placeCard(..., "discard")`, places `keepOrder` back on top of `ch.deck` in the chosen order.
  - `gmPeekWorld { charId, n = 3 }` — pushes a private pending prompt `{ type: "peekWorld", charId, cards: topNWorldIds }` (only during an active check).
  - `resolvePeekWorld { charId, swapWorldId?, rowIndex? }` — optional single swap between one of the `n` top world-deck cards and an unplayed slot `rowIndex >= ck.trick` in `ck.worldRow` (publicly announces `"The world row shifts"` + updated card, without exposing the other unseen world-deck cards).
- **Privacy (`views.mjs`):** `view.prompts` sends the peeked card objects **only** to `prompt.charId` (and the GM). Other phones and `/table` see only `waitingOn: [{ type: "peekDeck" | "peekWorld", charId }]`.

### Primitive 2: Set-Aside & Pinned Card Zone (`p.aside` & `card.pinned`)
Unlocks: **Red Thread** (set 1 card aside beside the row, tug back with +1 per trick away), **Scoped Rifle** (reveal 1 Dex card from hand), **Grave Sledge** (pin 1 ordinary card face up so playing it returns it to hand without consolation; stash under Sledge at cleanup), **Hearthhide Coat** (set statuses aside for the check, return at cleanup before consequences).

- **State on `ck.players[id]`:**
  - `aside: [{ card, faceUp: boolean, setAtTrick: number, tag?: string }]`
  - Optional `pinned: true` flag on a card in `p.hand` (shown face-up to everyone and visually marked `"Pinned"`).
- **Engine actions:**
  - `gmSetAside { charId, cardId, faceUp = true, tag? }` — moves a card from `p.hand` into `p.aside` (recording `setAtTrick: ck.trick`).
  - `gmReturnAside { charId, cardId, to = "hand", beatDelta? }` — returns a card from `p.aside` to `hand`, `discard`, or `tucked` (on an item). Optional `beatDelta` applies a per-card beating bonus (e.g., *Red Thread*'s `ck.trick - setAtTrick`).
  - `gmPinCard { charId, cardId, pinned = true }` — toggles `pinned` on an ordinary card in `p.hand`. In `resolveTrick()`, a played card with `pinned: true` returns straight to `p.hand` instead of `p.played` and grants no consolation.
- **Cleanup (`endCheck`):** any cards still in `p.aside` shuffle into `ch.discard` before consequence statuses (matching *Hearthhide Coat*'s exact cleanup timing) unless moved to an item's `tucked` list first (e.g., *Grave Sledge*).

### Primitive 3: Per-Card Value Overrides, Check Rules & Consolation Edits
Unlocks: **Grip Bone** (all cards of printed value X count as 10), **Iron Apple** (ordinary Strength < 5 counts as 5), **Black Wedge** (highest Strength card counts half, rounded down), **Iron Apple Seed** (next Strength card counts double), **Scoped Rifle** (revealed Dex card counts +5 on final trick), **Red Thread** (tugged card counts +1 per trick away), **Porter's Rope** (transfer Brace to another player).

- **State:**
  - Per-card `card.beat` (integer override) or `card.beatDelta` (integer offset) on cards in `p.hand`, cleared at `endCheck`.
  - Optional check-scoped rules array `p.cardRules: []` for simple passive transforms during the check:
    - `{ kind: "setValue", matchValue: 3, to: 10, label: "Grip Bone" }`
    - `{ kind: "minValue", suit: "S", min: 5, ordinaryOnly: true, label: "Iron Apple" }`
    - `{ kind: "multNext", suit: "S", mult: 2, label: "Iron Apple Seed" }`
  - `gmSetConsolation { charId, brace?, shave?, mirror?, reason? }` — lets the GM directly transfer or adjust `p.brace`, `p.shave`, or `p.mirror` (e.g., *Porter's Rope* moving Ana's `Brace +6` onto Ben).
- **Single source of truth (`countsNow`):**
  - Move `countsNow(card, p)` into `game/engine/cards.mjs` (or `check.mjs`) so `resolveTrick()`, `bot.mjs`, and `client.js` all evaluate the exact same effective beating value.
  - Because `handDock` already renders the flush Swiss `→N` adjustment band whenever `countsNow(c, p) !== c.v`, every item value override automatically shows up cleanly on the player's phone with zero extra UI work!

### Primitive 4: Trick Modifier Flags & Random Lock
Unlocks: **Black Wedge** (world card cannot take its trick; highest on-suit wins), **Borrowed Face** (first trick of named suit inverts: lowest card of that suit below world card wins, no trump), **Hushbell Chain** (everyone else who hears it plays a random card from hand).

- **State on `ck.worldRow[i]` (or `ck.trickMods[i]`):**
  - `worldCannotWin: true` — in `trickWinner()`, if no card beats `wv` (or even if `top <= wv`), ignore the world card's value as a floor; the single highest on-suit play wins (off-suit high cards still block as usual, ties break as usual).
  - `invert: true` — in `trickWinner()`, ignore trump; consider only plays matching `w.suit` with `bv < wv`; the single lowest card wins (or world takes it on a tie / no qualifying card).
- **Engine actions:**
  - `gmSetTrickMod { index, worldCannotWin?, invert?, reason? }` — sets/clears the flag on an unplayed world card `index >= ck.trick`, shown as a crisp pill under that world card on all screens.
  - `gmLockRandom { charIds: string[], reason? }` — for each active unlocked participant in `charIds`, picks a uniformly random card from `legalCards(st, id)` using `ctx.rng` and locks it in (so players can't peek before reveal, and it replays deterministically!).

### Primitive 5: Voluntary Sit-Out & Character Pool Swap
Unlocks: **Hollow Blindfold** (first off-suit win hits target exactly, then sit out the rest), **Halved Locket** (between checks, two characters swap their entire card pools).

- **Voluntary Sit-Out:**
  - Add `p.sitOut = false` on check participants and `gmSitOut { charId, sitOut = true, reason? }`.
  - Update `canPlay(st, id)` in `check.mjs` to `return !!(p && p.hand.length && !p.sitOut && !isBusted(p));` — reuses the exact same sit-out & auto-resolve flow we just shipped for `busted`!
- **Card Pool Swap (between checks):**
  - `gmSwapPools { charA, charB }` — swaps `{ deck, discard, reserve, compulsion, survival }` between two characters between checks (updating card `owner` or keeping original `owner` cleanly for Blessed return).

---

## Layer 3: GM Quick-Action Recipes (Full Coverage Matrix)

When a player clicks **Use** on an item, `gm.html` displays a compact **Item Action Card** at the top of the check (or Characters tab) with the item's full text, **Reveal Price** (for Relics), and 1-click buttons wired directly to Layers 1 & 2.

### Trinkets (14 / 14 covered)

| Trinket | Suit | Primitives used | GM Quick-Action buttons |
| --- | --- | --- | --- |
| **Black Wedge** | S | `gmSetTrickMod(worldCannotWin)`, `gmCardValue` | `[Wedge world card]` `[Halve highest Strength]` |
| **Grip Bone** | S | `gmCheckCardRule(setValue)`, `addConsequence(S)` | `[Set value X → 10]` `[Add Injury]` |
| **Iron Apple Seed** | S | `gmCheckCardRule(multNext S ×2)`, `addConsequence(D)`, `loseItem` | `[Next Strength ×2]` `[Add Stumble & consume]` |
| **Porter's Rope** | S | `gmSetConsolation` | `[Transfer Brace to ally…]` |
| **Red Thread** | D | `gmSetAside`, `gmReturnAside(+tricks)` | `[Set hand card aside]` `[Tug back (+N)]` |
| **Crooked Key** | D | `gmMoveCard(discard→hand)`, `gmDiscard`, `addConsequence(D)` | `[Open card editor]` `[Add Stumble]` |
| **Scoped Rifle** | D | `gmSetAside(faceUp)` or reveal flag + `gmCardValue(+5)`, `addConsequence(D)` | `[Reveal Dex card]` `[Apply +5 (final trick)]` `[Add Stumble]` |
| **Still Cricket** | D | `gmMoveCard(hand→deck-bottom)`, `gmDraw(1)`, `addConsequence(D)` | `[Bottom 1 & draw 1]` `[Add Stumble]` |
| **Slate Shard** | I | `gmBoost(+2)`, `addConsequence(I)` | `[Boost next +2]` `[Add Stress]` |
| **Ripped Page** | I | `gmPeekDeck(3, allowDiscard)`, `addConsequence(I)` | `[Peek top 3 of deck]` `[Add Stress]` |
| **Afterimage Lens** | I | `gmPeekWorld(3)`, `addConsequence(I + W)` | `[Peek top 3 of world deck]` `[Add Stress + Curse]` |
| **Whisper Jar** | W | `gmWorldValue(0)`, `addConsequence(I)` | `[World card counts 0]` `[Add Stress]` |
| **Borrowed Face** | W | `gmSetTrickMod(invert)`, `addConsequence(W)` | `[Invert next <suit> trick]` `[Add Curse (if missed)]` |
| **Sin Eater's Spoon** | W | `gmMoveCard(ally discard→reserve)` + `gainStatus(self)` | `[Take status from ally discard…]` |

### Relics (9 / 9 covered, including hidden Reveal Prices)

| Relic | Suit | Primitives used | GM Quick-Action buttons |
| --- | --- | --- | --- |
| **Grave Sledge** | S | `gmPinCard`, `addConsequence(S)`, `gmReturnAside(to: tucked)`, `revealItemPrice` | `[Pin ordinary card]` `[Reveal Price]` `[Add Injury & tuck pinned]` |
| **Hearthhide Coat** | S | `gmSetAside` (all statuses in hand) + `gmMoveCard(discard→hand)`, `addConsequence(W)`, `revealItemPrice` | `[Swap hand statuses from discard]` `[Reveal Price]` `[Add Curse]` |
| **Hushbell Chain** | D | `gmLockRandom(others)`, `updateItem(charges+1)`, `addConsequence(D × rings)`, `revealItemPrice` | `[Ring: random plays for others]` `[Reveal Price]` `[Add Stumbles]` |
| **Hollow Blindfold** | D | `gmAdjustTally(to target)` + `gmSitOut(true)`, `revealItemPrice` | `[Land on target & sit out]` `[Reveal Price]` |
| **Dead Ledger** | I | `gmMoveCard` (all Stress deck+discard→hand) + `gmShuffleDeck`, `revealItemPrice` | `[Pull all Stress to hand & shuffle]` `[Reveal Price]` `[Add Injury]` |
| **Halved Locket** | I | `gmSwapPools`, `updateItem(charges+1)`, `gainStatus(I × exchanges)`, `revealItemPrice` | `[Swap card pools]` `[Reveal Price]` `[Add Stress to both]` |
| **Wake Lantern** | W | Existing `ltr` bot / tucked 7 world cards (`item.tucked`), `revealItemPrice` | `[Tuck 7 world cards]` `[Summon dead-hand row]` `[Reveal Price]` |
| **Dying Ring** | W | `updateItem(charges±1)`, move entire deck+discard→hand, `addConsequence(S × 3)`, `revealItemPrice` | `[Spend charge: take deck+discard]` `[Reveal Price]` `[Add 3 Injuries]` |
| **Iron Apple** | S | `gmCheckCardRule(minValue S 5)`, `giveItem(iron-apple-seed, qty:4)`, `loseItem`, `revealItemPrice` | `[Strength < 5 counts 5]` `[Reveal Price]` `[Apply Price & grant 4 Seeds]` |

*(Note: **Peoples** benefit automatically too — e.g., **Varn**'s full hand mulligan, **Moon-Eyed**'s dark-scene discard-1/draw-1, and **Hollow-Skinned** / **Ashcrik** extra draws all work smoothly with these exact GM tools.)*

---

## Screen & UI Plan

All UI additions follow [AGENTS.md](../../AGENTS.md): Swiss Grid styling in `style.css`, no inline styles, light & dark mode, phone width (`390px`), and shared helpers in `client.js`.

- **Phone (`play.html`):**
  - **My cards → Items:** Show item cards with `qty`/`charges` badges, `note`, full front text, and — once `revealed: true` — a tinted **Price** section below the Relic. Add a **Use** button (with optional short note input) that notifies the GM and table.
  - **During a check:**
    - If `p.aside.length > 0`, show a compact **"Set aside"** strip beside the world stage (face-up cards visible to all, face-down only to owner & GM).
    - Pinned cards in hand carry a crisp `Pinned` badge; cards affected by item value overrides show the existing flush Swiss `→N` band automatically.
    - Private **Peek Top 3** prompt panel (using `promptPanel()`): tap/arrow buttons to reorder + optional discard toggles (`Ripped Page`), or tap 1 peeked card + 1 world-row card to swap (`Afterimage Lens`).
- **GM (`gm.html`):**
  - **Item Notification / Quick-Action Drawer:** When a player uses an item, show a dismissible panel on **The check** tab with the item's text, **Reveal Price** button (for Relics), and 1–2 shortcut buttons for that item.
  - **Characters → Items:** Manage `qty`, `charges`, `note`, **Reveal Price**, **Give custom item**, and **Swap card pools** between characters.
  - **Check Controls:** Expose **World card modifiers** (`Counts as…`, `World cannot win`, `Invert trick`) in the world-card tap menu, **Set aside / Pin** in `cardActions`, **Adjust Brace/Shave/Mirror** + **Sit out** + **Peek top N** in the player `Adjust` menu, and **Lock random card** for `Hushbell Chain`.
- **Table (`table.html`):**
  - Show trick-modifier pills (`World cannot win`, `Inverted`) under modified world cards.
  - Show face-up set-aside / pinned cards in a player's lane and a `Sitting out` chip when `p.sitOut` is active.
  - Toast/banner announcement when a Relic's Price is revealed (`"Grave Sledge — Price revealed"`).

---

## Phased Delivery Roadmap

### Phase 1: Rich Item Instances & Relic Price Reveals *(Highest value, smallest diff)*
- Upgrade `ch.items` to instance objects (`giveItem`, `loseItem`, `updateItem`, `revealItemPrice`, `useItem`).
- Expose `getPriceCardForRelic()` in `client.js` (while still hiding unrevealed prices in `viewFor`).
- Add Relic Price reveal UI, stack/charge counters, and custom/homebrew items on `gm.html` and `play.html`.
- Unit tests in `game/test/items.test.mjs` covering privacy of unrevealed prices, stacking, charges, and journal logging.

### Phase 2: Card Overrides, Consolation Edits, Set-Aside/Pinned & Sit-Out
- Move `countsNow(card, p)` into `game/engine/cards.mjs` with support for per-card `beat` / `beatDelta` and `p.cardRules`.
- Add `gmSetConsolation`, `gmSetAside`, `gmReturnAside`, `gmPinCard`, and `gmSitOut`.
- Update `resolveTrick()`, `endCheck()`, `views.mjs`, `play.html`, `table.html`, and `gm.html`.
- Unit tests for pinned card return (no consolation), set-aside cleanup ordering, `countsNow` parity, and voluntary sit-out.

### Phase 3: Peek Top-N Prompts, Trick Modifiers & Random Lock
- Add `gmPeekDeck` / `resolvePeekDeck` and `gmPeekWorld` / `resolvePeekWorld` with strict `viewFor` privacy.
- Add `gmSetTrickMod` (`worldCannotWin`, `invert`) in `trickWinner()` and `gmLockRandom`.
- Build private Peek/Reorder prompt UI in `play.html` and GM override controls in `gm.html`.
- Unit tests verifying hidden deck cards never leak to other seats or `/table`, plus inverted-trick and world-cannot-win resolution.

### Phase 4: GM Quick-Action Recipes, Pool Swap & Visual QA
- Add declarative recipe definitions in a shared browser module (`game/public/shared/item_recipes.js`) mapping each catalog `itemId` to 1-click GM shortcut buttons over Phases 1–3 primitives.
- Add `gmSwapPools` (for *Halved Locket*) and a *Wake Lantern* tucked-cards helper.
- Run full Playwright visual QA across `play.html`, `gm.html`, and `table.html` (phone & desktop, light & dark mode).

---

## Open Questions Before Starting Phase 1

1. **Clean break on `ch.items`?** Since we're dropping legacy support unless explicitly requested, should new saves assume `ch.items` are always instance objects (with a simple one-line fallback only if an existing in-use campaign currently holds string IDs)?
2. **Player counter edits:** Should players be able to edit their own item `note` (e.g., reminding themselves what they wrote on *Slate Shard* or joined with *Grave Sledge*), while leaving `charges`, `qty`, and `revealed` GM-only?
3. **Wake Lantern integration:** Should *Wake Lantern* spawn a temporary `ltr` open-hand participant linked to its holder (scoring directly into the holder's tally, no consolations), or stay a standalone GM-managed `ltr` bot?
