# Item Guide

Use with [RULES.md](../RULES.md). The live cards are in [item_catalog.js](item_catalog.js); unfinished designs belong in [workshop.md](workshop.md).

## At the table

- Before drawing, agree that the item applies, satisfy its **Wake**, and settle any bargain.
- Unless stated otherwise, invoke an item once per check, before a lead.
- An item may change a card's suit. It never changes declared trump.
- A value an item changes counts only when determining the trick winner. Printed value, Brace, and consolation never change.
- Drawing means taking the top card of your draw pile. Taking a card into hand from anywhere else is not drawing, so Stress does not duplicate. Taking a card out of discard is not rearranging it. Extra cards do not add tricks.
- Obey reserve limits and the thirteen-ordinary-card minimum. Discard extra or tucked cards with leftovers unless their effect names another destination.
- Costs and revealed Prices apply whenever the power is used, including outside a check. Outside a check, resolve them immediately unless the text names a later consequence. Injury still triggers the normal survival procedure.
- If a Cost needs a hand or trick result, make a check. Do not waive it.

Carrying or inspecting an item does not invoke it, and fictional use grants no later card benefit. Each player still scores only their own goal.

A personal card pool is the draw pile, hand, discard, played row, cards held by items, and reserve. Exchanging pools also transfers the Curse compulsion. If several effects alter the world row before play, resolve them in seating order from the first leader.

## Card anatomy

Omit empty slots. Never write “None.”

| Slot | Trinket | Relic | Reveal |
| --- | --- | --- | --- |
| *Form* | required | required | — |
| `Wake:` | required | required | — |
| `When:` | if needed | if needed | — |
| `Effect:` | required | required | — |
| `Cost:` | if any | — | — |
| `Price:` | — | — | required |
| *Mark* | required | required | 1–3 lines |
| `Reveal its price.` | — | final line | — |

- **Form:** one physical sentence. No mechanics.
- **Wake:** a concrete act that may be difficult or impossible now.
- **When:** the exact gate. Omit it if the effect always applies.
- **Effect:** the benefit.
- **Cost:** a trinket's visible payment.
- **Price:** a relic's hidden payment, on its reveal card.
- **Mark:** fiction only.

## Wording

Use only these timing anchors: `before drawing`, `after the deal`, `before a lead`, `after a trick`, `at cleanup`, `between checks`.

Use exact gates: `When your approach is Strength,` or Dexterity, Intelligence, Weird; `When survival is your forced goal,`.

Write statuses as `gain 1 Stress` or `gain 2 Injuries`, and a Curse that brings a taboo as `gain 1 Curse (compulsion: you may not …)`; write items as `acquire 1 Iron Apple Seed`. Write changed values as `counts as 10` or `counts 2 higher`; `printed value` is always the unchanged number. Write `take … into hand` for any card moved to hand other than by drawing. Use the named game suits, and `ordinary card` when statuses are excluded. Do not repeat global rules on a card.

Keep fiction specific. A Wake demands an action, an Effect changes the situation, a Cost hurts now, a Price changes the character, and a Mark shows what remains.

## Add or revise a card

1. Edit `ITEM_ENTRIES` in [item_catalog.js](item_catalog.js).
2. Use a stable kebab-case `id`, a display `label`, uppercase `title`, `kind` (`trinket`, `relic`, or `reveal`), suit, domain, lines, and a short `previewDescription`.
3. Put mechanics in plain text and fiction in `<em>...</em>`.
4. Preview `item_card.html?id=your-item-id` or open [the gallery](../index.html).
5. Run `npm run check:assets`.

## Export

```bash
npm run export:item-cards
npm run export:tts-item-deck
```

The first command writes individual images under `exports/tts/items/fronts/` and `back/`. The second rebuilds the sheet, back, manifest, and README under `exports/tts/items/deck/`.

[item_card.html](item_card.html) renders every card: [item_renderer.js](item_renderer.js) splits each card's lines into name, Form, slots, Marks, and the reveal band, and [item_card.css](item_card.css) styles them. Trinkets share [item_back.html](item_back.html) as their back; each relic's back is its Price card. The fonts load from Google Fonts, so previews and exports need a network connection. [item_catalog.js](item_catalog.js) drives the renderer, gallery, and exports.
