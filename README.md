# Trick

Trick is a small card-rendering project for a custom deck, status cards, and item cards. The source cards are authored as local HTML/CSS/JS files, previewed locally in the browser, and exported to PNG assets with Playwright.

The project currently includes:
- Five numbered suit families: Strength, Dexterity, Intelligence, Weird, and Divine.
- Five status cards: Injury, Dazed, Stress, Curse, and Blessed.
- A browser index page for local preview.
- Export scripts for individual card images and a Tabletop Simulator deck sheet.

## Requirements

- Node.js 18 or newer
- npm

## Install

```bash
npm install
```

## Preview Cards

Open `index.html` in a browser to browse the card set locally.

You can also open individual source files directly, for example:
- `strength.html`
- `dexterity.html`
- `intelligence.html`
- `weird.html`
- `divine.html`
- `items/item_card.html?id=black-wedge`

## Export Commands

Export individual front and back card PNGs:

```bash
npm run export:cards
```

This writes rendered assets under `exports/tts/fronts` and `exports/tts/back`.

Export the combined Tabletop Simulator custom deck assets:

```bash
npm run export:tts-deck
```

This writes files under `exports/tts/deck`, including:
- `trick-face-sheet.png`
- `trick-card-back.png`
- `trick-custom-deck-manifest.json`
- `README.md` with Tabletop Simulator import settings

Export the separate item card fronts and backs:

```bash
npm run export:item-cards
```

This writes rendered assets under `exports/tts/items/fronts` and `exports/tts/items/back`.

Export the combined Tabletop Simulator item deck assets:

```bash
npm run export:tts-item-deck
```

This writes files under `exports/tts/items/deck`, including:
- `trick-item-face-sheet.png`
- `trick-item-card-back.png`
- `trick-item-deck-manifest.json`
- `README.md` with Tabletop Simulator import settings

## Project Layout

- `index.html`: local gallery for browsing cards
- `card_template.html`: shared markup structure for suit-family cards
- `card_renderer.js`: card rendering logic used by the HTML card files
- `card_base.css`: shared card styling
- `items/item_catalog.js`: single source of truth for item card definitions, gallery metadata, and export order
- `items/item_card.html`: shared HTML shell for every trinket, relic, and reveal card
- `card_descriptions.txt`: card text source/reference
- `export_cards.mjs`: exports individual PNG cards with Playwright
- `export_tts_custom_deck.mjs`: builds the TTS sheet, back, and manifest
- `item_registry.mjs`: item deck export entry point backed by the shared item catalog
- `exports/tts/`: generated export artifacts

## Adding Items

Add new trinkets, relics, or reveal cards in `items/item_catalog.js`.

For a quick step-by-step item workflow, see `items/README.md`.

That one catalog now drives:
- the local browser gallery item sections in `index.html`
- individual item card rendering through `items/item_card.html?id=...`
- `npm run export:item-cards`
- `npm run export:tts-item-deck`

## Tabletop Simulator

The generated TTS deck output is documented in `exports/tts/deck/README.md`. The current deck export is built as a 10 by 6 sheet with 55 cards.

## Notes

The export scripts load the local HTML files directly through Playwright using file URLs. If card layout or copy changes, re-run the export commands to regenerate the PNG assets.