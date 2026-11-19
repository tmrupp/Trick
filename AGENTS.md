# Working on TRICK

Guidelines for anyone changing this repository, people and coding agents alike. The aim is one implementation of each idea and one way of presenting it.

## Where each truth lives

Change a thing in its home, then update what derives from it. Never fix a copy.

| What | Its home | Derived from it |
| --- | --- | --- |
| The rules, in words | `RULES.md` | `npm run build:guides` builds `rules.html`, `card_rules.js` and card descriptions. Then update by hand: `rules_reference.js`, `docs/alternatives/tally_sheet.html` (re-render the PDF), `docs/alternatives/TALLY.md`. |
| The rules, in code | `game/engine/` (`check.mjs` for a check, `campaign.mjs` for characters and cards, `cards.mjs` for decks and suits) | The app, the bots and `scripts/simulate_targets.mjs` all run on it. |
| Numbers RULES.md sets: check sizes, target ranges, difficulty bands, odds | `game/engine/rules.mjs` | The pages import it (served at `/engine/rules.mjs`). `game/test/rules_sync.test.mjs` checks RULES.md's difficulty table against it. |
| Suits: names, statuses, consolations, symbols | `SUIT_INFO` in `game/engine/cards.mjs` | `SUITS` in `game/public/shared/client.js` is built from it. Add page-only fields there, not new copies. |
| Who plays which character | `game/server/seats.mjs` | `room.mjs` calls it; nothing else edits seats. |
| Card text on screen (consolations, statuses, Blessed) | `card_rules.js`, built from RULES.md | `cardText()` and `consolationText()` in the client. Tooltips that state a rule read from these. |
| The difficulty table | `npm run sim:targets` (runs the engine) | Paste its rows into RULES.md and `DIFFICULTY_ODDS` together. |

`scripts/simulate_tally.mjs` is the variant lab: it keeps its own copy of the rules so it can try alternatives the engine doesn't implement. Don't use it for numbers that describe the current rules; use the engine.

## Engine

- **One path per kind of change.** Every card move goes through `placeCard`, `moveCard` and `takeFromReserve` in `campaign.mjs`: statuses gained, rest, Blessed, the GM's edits. A new effect that moves cards uses these. It doesn't push to a pile itself.
- **Actions are the GM's tools first.** The GM can do anything a player can, for any participant. Player actions such as `declareApproach` are a convenience that fills in what the GM can set directly with `setGoal`. Bots act through the same actions as players (`nextBotAction` in `bot.mjs`).
- **Compatibility code lives in `legacy.mjs`.** It exists only so older saves replay. New behaviour never depends on it. `legacy.mjs` lists every legacy branch elsewhere; keep that list current.
- **Saves keep their state.** A rule change must never rewrite a past check. Don't make loading depend on replaying actions under the current rules.
- **Who sees which notes** is decided in `room.notesFor` and `room.setNotes`, per seat. A player's own notes never leave their seat; GM notes reach only the GM.
- **Hidden information goes through `viewFor`.** Never send a screen more than its view. Events that name hidden cards are filtered per seat in `room.viewMessage`.
- **Every rule change gets a test**, in `game/test/`. Run `npm test` before you finish.

## Pages

The three screens (phone `play.html`, GM `gm.html`, table `table.html`) share `game/public/shared/client.js` and `style.css`.

- **Reach for the shared piece first.** Before writing UI, check `client.js`:
  - `mountHeader`: the header, connection dot and menu;
  - `handDock`: choosing and locking a card;
  - `trickLog`, `resultsList`, `choosingChip` (inline "choosing…" or "locked in" beside a name) and `choosingList` (names with their chips);
  - `layoutSwitch`: the auto/grid/list choice each screen offers in its menu (people go in a `.people` container, or `.lanes` on the table). Auto follows the window width live;
  - `cardFace`, `zoomCard`, `menu`, `openMenuAt`;
  - `segmented`: a small choice as buttons;
  - `confirmButton`, or a menu item's `confirm`: drastic actions;
  - `notesPanel`: the notes panel every screen opens from its menu (shared, mine, GM);
  - `sel`, `num`, `picked`, `announce` with `QUIET_EVENTS`, `markSuits`, `countsNow`.

  If two pages need the same block, it belongs in `client.js`, not in both pages.
- **Import the engine's constants**; don't restate them. Check sizes, difficulty words and hints, and suit data come from `/engine/*.mjs` through `client.js`.
- **No inline styles.** Use a class in `style.css`; the small layout helpers are at its end (`.ml`, `.mt`, `.field-label`, `.note-gap` and so on). The table screen's scale is set in `table.html`'s style block.
- **Interface conventions:**
  - Buttons sit next to what they act on; headers don't push them to the far edge.
  - A choice among a few options is a row of buttons (`segmented`). Dropdown menus are for long lists or grouped actions.
  - Drastic actions ask once in place (`confirmButton` or `confirm`), never with a nested "Yes" submenu.
  - Cards are picked the same way everywhere: select a card, then act on it nearby.
  - Whether someone is still choosing is always the same chip beside their name (`choosingChip`).
  - Collections of people support list and grid view. The default is auto: a grid on wide windows, a list on narrow ones, changing as the window does.
  - Seat tokens live per browser tab (`connect` in `client.js`), so one browser can play several characters in different tabs. Don't key anything per-player on localStorage alone.
  - The interface says suit names (Strength, Dexterity, Intelligence, Weird) and "trump", never Hearts, Spades, Diamonds, Clubs or "approach". Text with ♥♠♦♣ is drawn with the suit marks automatically.
  - Every screen works in light and dark mode and at phone width. Check both when you change layout.
- **Verify in a browser.** Drive the real pages (Playwright works well) and look at screenshots for every visible change. Tests alone don't show layout.

## Before you finish

- `npm test` passes.
- If RULES.md changed: `npm run build:guides && npm run check:assets`, then the exports that show rules text (`export:reference-cards`, `export:tts-reference-deck`, `export:print`; `export:cards`, `export:cards:dark`, `export:tts-deck` and `export:web-cards` when card faces change).
- If a rule's numbers changed: `npm run sim:targets`, then RULES.md and `rules.mjs` together.
- Restart a running host (`npm run restart`) so it loads the new engine.
- `TRICK.exe` carries its own copy of the game: rebuild it (`npm run build:exe`) when you want it to have your changes. How the host starts lives in `game/server/start.mjs`, shared by `npm start` and the exe's launcher (`game/launcher/trick.mjs`).
