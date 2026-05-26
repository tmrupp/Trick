# Creating Item Cards From Scratch

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

Typical conventions in this repo:

- Trinkets usually show rule, effect, cost, and a narrative mark on the front.
- Relics usually show invocation, effect, optional fiction text, and a final line such as `Reveal this relic's price after use.`
- Reveal cards usually hold the concealed mechanical price plus narrative fallout.

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
    "Rule: Press the thorn into your thumb before the check starts.",
    "Effect: In a Weird check, draw 1 extra card after the first trick.",
    "Cost: Add 1 Stress after the check.",
    "<em>Mark: Ash smears under the skin until you next rest.</em>"
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
    "At the end of the check, add 1 Stress.",
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
- If a card gets too dense, shorten copy before changing shared layout.
- Relics and reveals are separate entries; adding a relic does not automatically create its reveal card.
