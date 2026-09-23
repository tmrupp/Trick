# Peoples Guide

Optional setting abilities for the six peoples of Black Valley. Use with [RULES.md](../RULES.md); nothing here is needed for core play. The live text is in [race_catalog.js](race_catalog.js), which drives the reference cards, the [gallery](../index.html), the generated [race_mechanics.html](../race_mechanics.html), and the exports. Lore lives in [setting_races.html](../setting_races.html).

## At the table

- Agree abilities and any goal requirements **before drawing**.
- Each player still has one separate goal and one declared approach fixing their personal trump. Wins are never pooled or transferred.
- Use ability choices independently during resolution. No new negotiation once drawing begins.
- Extra cards do not add tricks. Stress duplicates whenever drawn, including extra draws and redraws.
- All card gains use your reserve and removals return there. Survival costs stay fixed once locked.
- Discard extra cards with the leftovers in the ordinary cleanup order.

That list is the `shared-timing` card, which doubles as the back of every people's card.

## Card anatomy

| Field | Use |
| --- | --- |
| `name` | The people, printed as the card title. |
| `abilityTitle` | The ability's name, printed above the title as the card's kicker. |
| `tags` | Two short setting labels, shown on the generated page. |
| `accent` | The card's single accent colour; everything else derives from it. |
| `flavor` | One or two fiction sentences. No mechanics. |
| `rules` | The ability, one paragraph per clause, in the same wording the page uses. |
| `previewDescription` | One line for the gallery card. |

Write rules text with clear timing anchors — `before drawing`, `when you must draw from an empty deck`, `after the deal`, `before a lead`, `after a trick`, `at cleanup`, `between checks` — and write statuses as `gain 1 Curse` or `draw 2 extra cards`. Do not repeat the shared timing on an individual card.

## Add or revise a people

1. Edit `RACE_ENTRIES` in [race_catalog.js](race_catalog.js), and add a matching glyph to `RACE_ICONS` (a 100x100 `viewBox`, `fill="none"`, `stroke="currentColor"`).
2. Preview `race_card.html?id=your-id` or open [the gallery](../index.html).
3. Run `npm run build:guides` to regenerate `race_mechanics.html`.
4. Run `npm run check:assets` to catch clipped text and broken links.
5. Update the matching lore entry in [setting_races.html](../setting_races.html).

Keep the ability text short enough to fit the card; the asset check fails on overflow.

## Export

```bash
npm run export:reference-cards
npm run export:tts-reference-deck
```

The first command writes individual images under `exports/tts/reference/fronts/` and `back/`. The second rebuilds the sheet, back sheet, manifest, and README under `exports/tts/reference/deck/`. Both cover the six peoples and the two-sided rules card; every people's back is the shared timing card.
