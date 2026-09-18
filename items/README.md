# Optional items

Use with [RULES.md](../RULES.md). Item effects are optional exceptions, not part of the core player guide. Agree which items apply to a declared goal, their activation, and any bargain before anyone draws. Each participant's approach fixes their personal trump for the check. Items may change card suits but never that declared trump. During resolution, use choices independently without tactical negotiation.

Unless an item explicitly repeats, invoke it at most once per check, before a lead. After-deal effects happen after the N-card initial hand is complete. Taking cards from deck or discard into hand counts as drawing; Stress duplicates on every draw. Extra cards never add tricks. Use the normal reserve limits and thirteen-ordinary-card minimum. Discard extra or tucked cards with leftovers unless their effect specifies a destination. Pending costs apply with consequences at cleanup. Survival goals come only from the ordinary check-start and Injury-gain scans, whose recorded costs stay fixed. Required survival takes priority over other forced goals. Each player scores only their own goal; item text about help permits cooperation through play, never pooled wins.

Gain Injuries only at cleanup or between checks; any Injury cost incurred during play waits for cleanup.

Personal card pools include draw pile, hand, discard, played row, cards set aside by items, and reserve. A between-check exchange of pools also transfers the associated Curse compulsion. When several players alter the world row before play, resolve those effects in seating order from the first leader; this is only an effect tiebreak.

## Using items outside checks

Invoking an item's power outside a check still requires its Wake and incurs its Cost and any revealed Price. Apply statuses, consumption, and fictional consequences when the use resolves, including costs otherwise due at cleanup. Keep stated conditions and explicitly later consequences. Injury gains follow the normal between-check survival rules. Carrying, inspecting, or ordinarily handling an item does not invoke it.

If a cost requires a hand or a trick outcome, resolve the use as a check so that cost can apply; do not waive it or defer it to a later hand. Fictional use grants no unstated card benefit in a later check. Effects explicitly available between checks still apply as written.

## Creating item cards

The item card system is data-driven. To create a new trinket, relic, or reveal card from scratch, you only need to add one entry to `item_catalog.js`, preview it, and run the export commands.

## Workflow Overview

1. Decide what kind of item you are making.
2. Add the item definition in `items/item_catalog.js`.
3. Preview the card locally in `items/item_card.html?id=...`.
4. Export individual item PNGs.
5. Export the combined TTS item deck if needed.

## Step 1: Choose the Card Type

Use one of these `kind` values:

- `trinket`: lighter item tier, uses the `trinklet.svg` icon and standard item styling.
- `relic`: heavier item tier, uses the `relic.svg` icon and standard item styling.
- `reveal`: hidden drawback/reveal card, uses the `relic.svg` icon and reveal styling.

## The item template

Every item card fills the same slots in the same order. **Omit a slot rather than filling it with "None".**

| Slot | Style | Trinket | Relic | Reveal |
| --- | --- | --- | --- | --- |
| Form | `<em>` | required | required | — |
| `Wake:` | plain | required | required | — |
| `When:` | plain | if gated | if gated | — |
| `Effect:` | plain | required | required | — |
| `Cost:` | plain | if any | never | — |
| `Price:` | plain | — | — | required |
| Mark | `<em>` | required | required | one to three lines |
| `Reveal its price.` | plain | — | required, last line | — |

- **Form** is what the object is: one sentence, physical, no mechanics.
- **Wake** is the ritual that arms it. Fiction with teeth, so the GM can rule it impossible right now.
- **When** is the gate. Omit it when the item always applies.
- **Effect** is the benefit, written in the vocabulary below.
- **Cost** is the price of invoking the item, inside or outside a check. Trinkets carry their cost on the front; relics never do, because a relic's price is its reveal card.
- **Mark** is what the item leaves behind. Fiction only: a Mark never carries a mechanic.
- A relic's last line is always `Reveal its price.`, and its reveal card opens with `Price:`.

## Controlled vocabulary

Item text is rules text. Use these exact phrases so no card invents a timing or a term the core rules lack.

**Timing.** Only these six anchors:

| Anchor | Means |
| --- | --- |
| `before drawing` | during negotiation, before anyone has cards |
| `after the deal` | once every hand and the world row are complete |
| `before a lead` | between tricks, before the next leader plays |
| `after a trick` | once the winner is settled and consolations have resolved |
| `at cleanup` | during the check's cleanup steps |
| `between checks` | after cleanup, before the next check begins |

Never write "before the check starts", "before the work starts", "after the initial deal", "during a check", "at the end of the check", or "after the check".

**Gates.** Name the suit, never a loose keyword:

- `When your approach is Strength,` (or Dexterity, Intelligence, Weird)
- `When survival is your forced goal,`

A declared approach *is* a suit, so the suit is the exact test. Keywords like "force or endurance" drift from the approach lists in RULES.md, and one card already gates on "precision", which is not a Dexterity approach at all.

**Statuses.** Always `gain`, always a numeral, always the capitalised name: `gain 1 Stress`, `gain 2 Injuries`. Never say where it lands. The core rules already put gained statuses in discard and already hold Injuries until cleanup, so "add 1 Stumble to your discard after the check" gets three things wrong at once.

**Cards.** Write `printed value`, never bare "value", because Brace depends on that distinction. Use the four game suits (Strength, Dexterity, Intelligence, Weird), never Spades, Clubs, Diamonds or Hearts. Write `ordinary card` wherever statuses must be excluded.

**Do not restate global rules.** The preamble at the top of this file already covers taking cards into hand counting as drawing, Stress duplicating on every draw, extra cards never adding tricks, reserve limits and the thirteen-card minimum, and the once-per-check limit. A card that repeats them is longer and no clearer.

## Step 2: Add the Item Entry

Open `items/item_catalog.js` and add a new object to `ITEM_ENTRIES`.

Each item entry should define:

- `id`: unique kebab-case identifier used in URLs and export file names
- `label`: display name used in exports and the gallery
- `title`: uppercase card title shown on the card
- `kind`: `trinket`, `relic`, or `reveal`
- `suit`: `strength`, `dexterity`, `intelligence`, or `weird`
- `domain`: text shown above the title, such as `Trinket`, `Relic`, or `Reveal After Use`
- `lines`: array of rendered text blocks in display order
- `previewDescription`: short description shown in the browser gallery

If a line is narrative text, wrap that line in `<em>...</em>` so it renders in italics.

## Example: Create a New Trinket

```js
{
  id: "ash-thorn",
  label: "Ash Thorn",
  title: "ASH THORN",
  kind: "trinket",
  suit: "weird",
  domain: "Trinket",
  lines: [
    "<em>A soot-black thorn, longer than it looks and warm to the touch.</em>",
    "Wake: Press it into your thumb until it draws blood.",
    "When: Your approach is Weird.",
    "Effect: After the deal, draw 1 card.",
    "Cost: Gain 1 Stress.",
    "<em>Ash smears under the skin until you next rest.</em>"
  ],
  previewDescription: "A soot-black thorn that buys a little extra reach at a personal cost."
}
```

## Example: Add a Matching Reveal Card

If your new relic needs a hidden price card, add a separate second entry with `kind: "reveal"`.

```js
{
  id: "ash-thorn-price",
  label: "Ash Thorn Price",
  title: "ASH THORN PRICE",
  kind: "reveal",
  suit: "weird",
  domain: "Reveal After Use",
  lines: [
    "Price: At cleanup, gain 1 Stress.",
    "<em>Ash spreads beneath the skin of your hand and wrist.</em>",
    "<em>Smoke follows your breath for the rest of the scene.</em>"
  ],
  previewDescription: "Hidden consequence card for Ash Thorn."
}
```

## Step 3: Preview the Card Locally

After saving `items/item_catalog.js`, preview the card in the browser at:

```text
items/item_card.html?id=your-item-id
```

Example:

```text
items/item_card.html?id=ash-thorn
```

You can also open `index.html` to see the item appear in the correct gallery section.

## Step 4: Export Individual Item PNGs

To render all item fronts plus the shared back image:

```bash
npm run export:item-cards
```

This writes files to:

- `exports/tts/items/fronts/`
- `exports/tts/items/back/`

Your new item should appear as:

```text
exports/tts/items/fronts/your-item-id.png
```

## Step 5: Export the TTS Item Deck Sheet

To rebuild the combined Tabletop Simulator item deck:

```bash
npm run export:tts-item-deck
```

This updates:

- `exports/tts/items/deck/trick-item-face-sheet.png`
- `exports/tts/items/deck/trick-item-card-back.png`
- `exports/tts/items/deck/trick-item-deck-manifest.json`
- `exports/tts/items/deck/README.md`

## How the System Works

- `items/item_card.html` is the shared HTML shell for every item card.
- `items/item_catalog.js` is the single source of truth for item definitions.
- `index.html` builds its item sections from that same catalog.
- `item_registry.mjs` reads from the same catalog for exports.
- `export_item_cards.mjs` renders individual item images.
- `export_tts_item_deck.mjs` builds the combined TTS item deck sheet.

## Practical Tips

- Keep `id` values stable once exported, since they become file names.
- Use uppercase in `title` to match the existing cards.
- Keep mechanical text plain and wrap narrative text in `<em>`.
- Follow the template's slot order exactly, and drop empty slots instead of writing "None".
- If a card gets too dense, shorten copy before changing shared layout.
- Relics and reveals are separate entries; adding a relic does not automatically create its reveal card.
