# Trick

Trick is a small card-rendering project for a custom deck and status cards. The source cards are authored as standalone HTML/CSS/JS files, previewed locally in the browser, and exported to PNG assets with Playwright.

The project currently includes:
- Four numbered suit families: Strength, Dexterity, Intelligence, and Weird.
- Four status cards: Injury, Dazed, Stress, and Curse.
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

## Project Layout

- `index.html`: local gallery for browsing cards
- `card_template.html`: shared markup structure for suit-family cards
- `card_renderer.js`: card rendering logic used by the HTML card files
- `card_base.css`: shared card styling
- `card_descriptions.txt`: card text source/reference
- `export_cards.mjs`: exports individual PNG cards with Playwright
- `export_tts_custom_deck.mjs`: builds the TTS sheet, back, and manifest
- `exports/tts/`: generated export artifacts

## Tabletop Simulator

The generated TTS deck output is documented in `exports/tts/deck/README.md`. The current deck export is built as a 10 by 5 sheet with 44 cards.

## Notes

The export scripts load the local HTML files directly through Playwright using file URLs. If card layout or copy changes, re-run the export commands to regenerate the PNG assets.