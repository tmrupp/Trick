# Trick

The rules are in **[RULES.md](RULES.md)**, the single source of truth, with a generated [browser version](rules.html). The two-sided [rules reference card](rules_reference_card.html) condenses them for the table.

Trick is a game of simultaneous group checks using **two standard decks per player** and one for the GM. Four suits describe approaches; face cards are statuses. Before drawing, each player and the world declare an approach that fixes their personal trump for the whole check. Each player has one separate goal and scores only their own wins; cooperation happens through fiction and card play. Threats can force a goal, including survival for an endangered character. Highest personal trump wins, regardless of suit; otherwise the highest card of the led suit wins.

The repository also provides optional custom card art, setting items, and Tabletop Simulator exports. Current suits are Strength/Hearts, Dexterity/Spades, Intelligence/Diamonds, and Weird/Clubs; their statuses are Injury, Stumble, Stress, and Curse. The jokers are Blessed cards, which win any trick they are played in. Divine is an archived concept.

The [card gallery](index.html) uses current shared card text. [Optional peoples](race_mechanics.html), [item conventions](items/README.md), and [Session 0 town questions](session0_town_questions.html) extend the core rules. Earlier audits and trump proposals are historical; see [docs/history](docs/history/README.md).

Two reference card sets print at the same size as the deck: a **two-sided rules card** carrying the whole table procedure, and **one card per people** with its ability, backed by a shared timing card. See the [peoples guide](races/README.md).

Two independent deck-building prototypes, **Joinery** and **Undertow**, are described in [the alternatives comparison](docs/alternatives/README.md). They are experiments, not changes to these rules.

## Updating references

Edit `RULES.md` for every rule. Its Consolations and Statuses tables and its Blessed rule list are printed on the card faces: `npm run build:guides` regenerates `card_rules.js` from them, and `npm run check:assets` fails if that file is stale. The one hand-written summary is `rules_reference.js`, the two-sided rules card; update it whenever RULES.md changes. Edit `races/race_catalog.js` for the peoples; it also generates `race_mechanics.html`.

Run `npm run build:guides` to regenerate `rules.html`, the text rules reference, the peoples page, `card_rules.js`, and card descriptions. The retired player guide's URLs, `player_guide.html` and `reference.html`, forward to `rules.html`; `trick_taking_rpg_rules_v4.html` also carries the current rules. Earlier versions are archived.

Run `npm run check:assets` to check current card text for clipping, verify the 52-card export composition, and check links in the readable references. Inspection images and a report are written under `exports/qa/`.

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

Export the separate reference card fronts and backs, one per people plus the two-sided rules card:

```bash
npm run export:reference-cards
```

This writes rendered assets under `exports/tts/reference/fronts` and `exports/tts/reference/back`. Every people's back is the shared timing card; the rules card's back is its second side.

Export the combined Tabletop Simulator reference deck assets:

```bash
npm run export:tts-reference-deck
```

This writes files under `exports/tts/reference/deck`, including:
- `trick-reference-face-sheet.png`
- `trick-reference-back-sheet.png`
- `trick-reference-deck-manifest.json`
- `README.md` with Tabletop Simulator import and printing settings

## Project Layout

- `index.html`: local gallery for browsing cards
- `card_template.html`: shared markup structure for suit-family cards
- `card_renderer.js`: card rendering logic used by the HTML card files
- `card_base.css`: shared card styling
- `items/item_catalog.js`: single source of truth for item card definitions, gallery metadata, and export order
- `items/item_card.html`: shared HTML shell for every trinket, relic, and reveal card
- `card_rules.js`: card text generated from the tables in `RULES.md`; do not edit by hand
- `card_descriptions.txt`: generated card text reference
- `races/race_catalog.js`: single source of truth for the peoples' abilities, card text, and generated `race_mechanics.html`
- `races/race_card.html`: shared HTML shell for every people's card
- `rules_reference.js` and `rules_reference_card.html`: text and shell for the two-sided rules card
- `reference_registry.mjs`: reference deck export entry point backed by the race catalog and the rules card
- `export_reference_cards.mjs`, `export_tts_reference_deck.mjs`: individual and combined reference card exports
- `RULES.md`: the single rules source
- `scripts/rules_source.mjs`: reads the card-facing tables from `RULES.md`
- `scripts/build_guides.mjs`: regenerates the rules pages, card text, and peoples page
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

The generated TTS deck output is documented in [exports/tts/deck/README.md](exports/tts/deck/README.md). It is a 10 by 6 sheet containing **52 cards**: forty ordinary cards and three copies of each of the four statuses. Import twice per player. From one copy, take **2, 4, 6, 8 of every suit**, plus **A, 5, 9 of your primary** and **3, 7 of a different secondary**. This gives a 21-card starter distributed 7/6/4/4; the rest of that copy and the entire second copy form reserve. Use only A–10 from a separate copy for the world.

## Notes

The export scripts load the local HTML files directly through Playwright using file URLs. If card layout or copy changes, re-run the export commands to regenerate the PNG assets.
