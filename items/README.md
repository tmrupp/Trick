# Adding Item Cards

The item card system is data-driven. To add a new trinket, relic, or reveal card, you only need to edit `item_catalog.js`.

## Quick Steps

1. Open `items/item_catalog.js`.
2. Add a new object to `ITEM_ENTRIES`.
3. Set a unique `id` using kebab-case, for example `ash-thorn`.
4. Fill in the card fields:
   - `label`: display name used in exports and the gallery
   - `title`: uppercase card title shown on the card
   - `kind`: `trinket`, `relic`, or `reveal`
   - `suit`: `strength`, `dexterity`, `intelligence`, or `weird`
   - `domain`: text shown above the card title
   - `lines`: array of rendered text blocks in display order
   - `previewDescription`: short gallery description
5. If the line is narrative text, wrap that line in `<em>...</em>`.
6. Save the file.
7. Preview the card locally at `items/item_card.html?id=your-item-id`.
8. Rebuild exports if needed:
   - `npm run export:item-cards`
   - `npm run export:tts-item-deck`

## Example Entry

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

## Notes

- `item_card.html` is the shared HTML shell for every item card.
- `item_catalog.js` also drives the item gallery in `index.html` and both item export scripts.
- `kind: "reveal"` automatically uses the reveal card styling.
- `kind: "trinket"` uses `trinklet.svg`; every other kind uses `relic.svg`.
