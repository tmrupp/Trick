# TRICK, digital

The rules of [RULES.md](../RULES.md) as code, and a host server for playing them with phones, as planned in [docs/digital/PLAN.md](../docs/digital/PLAN.md). Every phase of the plan is built. The one thing left is a real table playing through it.

```bash
npm run build:exe    # build dist/TRICK.exe: double-click it to host, no terminal needed (docs/digital/DEPLOY.md)
npm start            # host with a public link through a Cloudflare quick tunnel
npm run start:local  # host on this computer only
npm run restart      # stop any running host, start again with the tunnel, and open the host, table and GM windows
npm run restart:local
npm test             # engine rules, replay, card conservation, parity, and server tests
npm run sim:engine   # bots play the default scene through the engine (add a number of checks)
```

## Hosting a game

1. **Install cloudflared once** for the public link: on Windows, `winget install --id Cloudflare.cloudflared`. Without it, `npm start` still runs, local only.
2. **Run `npm start`.** It prints a private host page link (with an admin token) and a public `trycloudflare.com` link. The public link changes each time you start. `npm run restart` does all of this in one go: it stops an older host on the same port (only if it is Node), opens your most recently played campaign, and opens the host, table and GM pages in Chrome or Edge windows. Add a campaign id to open a different one: `npm run restart -- --open black-valley`.
3. **On the host page,** create a campaign or open a saved one. Each campaign shows its room code, a QR code and join link for players, a link to the table screen, and the secret GM link.
4. **Players** scan the QR code or open the join link, enter a name, and create their character on their phone. A phone that sleeps or drops rejoins its seat automatically. Each browser tab holds its own seat, so one computer can play several characters in different tabs; a new tab picks up the browser's last seat only if no other tab has it open. A player on a new browser or a new link (every quick-tunnel restart is a new link) picks their character under **Coming back?** on the join screen; it lists characters whose phone isn't connected, and the old browser stops working for that seat. If the host restarted, a room opens by itself when a phone asks for its code. A player can make another character between checks (from **My cards**, or straight from the banner when theirs dies) and switch between their characters there; the others stay in the campaign. The GM can bring a dead character back from the Characters tab (`resurrect`); their cards stay as they were. The GM can also **add bots** (Room and seats → Add a bot): a **greedy** bot goes for any world card it can take without busting and keeps its hand hidden; a **left-to-right** bot plays its leftmost legal card every trick with its hand face up for everyone, like the Wake Lantern's dead hand, never Peeks, and Recalculates its leftmost card. Name a bot when you add it, or rename it (and any character) later with `renameCharacter`. Bots declare their primary suit with no written goal; before the deal the GM can change a bot's trump from its Trump menu, and sets its target. The host plays their turns a moment after each change.
5. **The GM** opens the GM link, on a phone or the laptop. A banner always says what to do next. The GM sets each participant's trump, goal and target (players can fill in theirs from their phones as a convenience, and the table screen shows the setup to everyone), and can add consequences, give items, grant rest and Blessed, remove a seat, and hand a character to a new seat. A GM who wants to play a character too opens the join link in another tab, like any player.
6. **History.** Every screen has the campaign's history (a History tab on the GM screen and phones, "Campaign history" in the table's menu): the cast with each check's result, every check with its goals, results, consequences and tricks, what happened between checks, and the notes that screen may read. The engine keeps it in `state.journal` (see `JOURNAL` in `engine/index.mjs`) and each check's record in `state.history`; saves from before the journal show their older checks by result only.

## The screens

- **Phone (`/play`).** Character creation with suits and a people; your goal and its suit for each check; a hand of the printed cards with forced statuses marked and each card's text a tap away; prompts that explain Recalculate, Stumble's Price and evolution; your tally against your target; a **My cards** tab with deck contents, discard, statuses, compulsion, survival warnings and items (with a **Use** button that tells the table); a link to print your cards.
- **Table (`/table`, or `/watch` for spectators).** The join QR code, the world row, each player's tally and progress to target, who has locked in (face down), a reveal at every trick with a one-line reason, waiting reminders, and results.
- **GM (`/gm`).** Tabs for the check (setup with the difficulty beside each target, hands, adjustments, results and consequences), characters (statuses, Curses, rest, Blessed, items) and the room (join link, seats, assigning characters, playing a character).
- **Notes.** Plain-text notes kept with the campaign, edited in place from any screen's menu (Notes): **Shared** (players and the GM edit; the table reads), **GM** (only the GM) and **Mine** (each player's own, seen by them alone). Typing saves after a pause and other screens update live. **Import a Google Doc** adds the text of a doc shared as "Anyone with the link" to the end.
- **Host (`/host`).** Create, open, close, download, import and archive campaigns. Closing disconnects a campaign's screens and unloads its room but keeps the save; archiving also moves the save to `saves/archive`.
- **Rules (`/rules`)** and **print (`/print`)** pages.

Every screen draws the printed card art (`npm run export:web-cards` makes small copies in `exports/web/light` and `exports/web/dark`) and follows the device's light or dark setting, with pages styled like the cards: tinted paper, suit inks, ruled borders, and the cards' typefaces. Sounds and phone buzzes can be turned off on each screen. Animations respect the reduced-motion setting.

**Items and peoples** are chosen from `items/item_catalog.js` and `races/race_catalog.js`. Their effects are applied by the GM with adjustment tools: a boost to someone's next card, a world card's value for beating, a tally or target change, a draw or a discard. Each adjustment is announced to the table with its reason.

Campaigns are saved in `game/saves/` (one file each, ignored by git) after every action, and replay exactly when reopened. To run on a cloud server with a permanent link, or to move a campaign between hosts, see [docs/digital/DEPLOY.md](../docs/digital/DEPLOY.md). Old join links keep working when the same campaign is opened again; the tunnel's address is new each time.

**Keep two links private:** the host page link (it opens campaigns) and the GM link (it runs the game). The join link and room code are for players. Joins are rate-limited per address, rooms hold at most ten players, and the GM can remove a seat.

## The server

- `server/app.mjs` serves the pages, the admin API (`/api/*`, needs the `x-admin` token) and one WebSocket per screen at `/ws`.
- `server/room.mjs` holds a campaign's state and seats, checks who may send each action, and sends each client only `viewFor()` its own role: players act only for their own character, and the GM may do anything.
- `server/store.mjs` saves campaigns atomically. `server/tunnel.mjs` starts the quick tunnel.
- `public/` holds the bare pages: `host.html`, `table.html` (the big screen), `play.html` (a phone) and `gm.html`.

Messages are JSON: a client sends `hello` (`{ room, as: "player" | "gm" | "table", token, name, gmKey }`), then `action` (`{ seq, action }`) or `manage` (`{ seq, op: "remove", seatId }`). The server answers `welcome`, `view` (the room, the client's view and the latest events), `ok`, `rejected` (with a reason to show) or `error`.

## How it works

The engine is a reducer over plain JSON-safe data. A game is created from a seed, and every change is an action:

```js
import { createGame, apply, viewFor } from "./engine/index.mjs";

let game = createGame({ seed: "table-1" });
({ state: game } = apply(game, { type: "createCharacter", id: "ana", name: "Ana", primary: "S", secondary: "D", others: ["I", "W"] }));
({ state: game } = apply(game, { type: "beginCheck", kind: "standard", participants: ["ana", "ben", "cara"] }));
// … declareApproach (the player's goal and its suit), setGoal (the target, which accepts the goal), deal, lockCard, recalculate, addConsequence, endCheck
const phone = viewFor(game, { role: "player", charId: "ana" }); // only what Ana may see
```

- **`apply(state, action)`** returns `{ state, events }` and never changes its input. An illegal action throws a `RuleError` whose message is written for the player: "You must play your Stumble: the world card is Spades."
- **Randomness is seeded** and kept in the state, so `replay({ seed }, state.actions)` rebuilds any game exactly.
- **`viewFor(state, who)`** is the only thing a screen should receive. The table never sees a hand or the world deck. A phone sees its own hand, legal plays and prompts. Nobody sees the world deck, not even when a Peek replaces a card from it.
- **Events** describe what happened ("trickResolved" with the reason, "pricePaid", "survivalRequired") for the screens to animate.

Suits are `S` (Strength, Hearts), `D` (Dexterity, Spades), `I` (Intelligence, Diamonds) and `W` (Weird, Clubs). Every pile is an array whose top is its last element.

## Actions

| Action | When | Who |
| --- | --- | --- |
| `createCharacter { id, name, primary, secondary, others }` | Any time | A player. `others` lists the two remaining suits; the first takes 2, 3, 6, 9 |
| `setSeats { seats, gmSeat }` | Any time | GM. No longer in the pages: it only sets display order. Kept so older saves replay |
| `beginCheck { kind, participants }` | No check running | GM. Runs the survival scan |
| `declareApproach { charId, goal, suit, suggested }` | Setup | The player states their goal, the suit it leans on (their trump), and optionally a suggested target. A survival goal is fixed and accepted at once; restating a goal sends it back to the GM |
| `setGoal { charId, suit, goal, target }` | Setup | GM: sets any of a participant's trump, goal and target directly, with or without their input; a player's `declareApproach` is a convenience that fills these in. A participant with a trump and a target is ready. A survival target is fixed at 3 × M. (`approveApproach` remains only so older saves replay) |
| `peek { charId, replace }` | After a trick | A player who lost with a Spade: replace the next world card unseen, or keep it |
| `resurrect { charId }` | Between checks | GM: bring a dead character back |
| `gmMoveCard { charId, cardId, to }`, `gmAddCard { charId, kind, suit, v, to }`, `gmShuffleDeck { charId }` | Any time | GM: free card editing for items and story effects. `to` is `deck-top`, `deck-bottom`, `deck-shuffle`, `discard`, `hand` (in a check) or `reserve` (removes it). Adding takes a matching card from reserve, or makes an extra one. Only the GM and that player are told |
| `deal` | Setup | GM. Deals the world row and draws every hand |
| `lockCard { charId, cardId, priceCardId }`, `unlockCard { charId }` | Play | A player. The trick resolves when everyone with cards has locked |
| `recalculate { charId, cardId }` | Consolation | A player who lost with a Diamond |
| `giveBlessed { charId, to, cardId }` | Between tricks | A player holding a Blessed |
| `evolve { charId, skip \| suit, mode, cardId }`, `evolvePick { charId, cardId }` | When a draw reshuffles and evolution is possible | That player |
| `addConsequence { charId, suit, compulsion }`, `endCheck` | After the final trick | GM |
| `gainStatus`, `curseViolation`, `rest`, `grantBlessed` | Between checks (`grantBlessed` any time) | GM |
| `giveItem`, `loseItem { charId, itemId }` | Any time | GM |
| `useItem { charId, itemId, note }` | Any time | The item's holder: announces it |
| `gmBoost`, `gmWorldValue`, `gmAdjustTally`, `gmAdjustTarget`, `gmDraw`, `gmDiscard` | During a check | GM: applies item, people and fiction effects |

The server checks who may send which action: see *The server* above.

## Rulings the engine makes

Where RULES.md leaves a detail open, the engine decides as follows. Each is covered by a test, and any of them can change:

- **Peek is a blind choice.** Everyone who lost with a Spade (a Stumble included) answers a `peek` prompt, `replace: true` or `false`, without seeing the world deck or each other's answers. When all have answered, the next world card goes to the bottom of the world deck and the top card takes its place, once, if anyone chose to replace. It is skipped when the world deck is empty. Saves from while Peek was automatic replay with `rules.peek: "auto"`.
- **A played Blessed returns to its owner's reserve,** even after being given to another player.
- **A player's card equal to the world card doesn't beat it:** the world takes the trick.
- **Evolution in preparation follows the main procedure:** the remaining status, and a gained card, stay in discard and shuffle in. **Mid-check**, they are set aside and land on top of the new discard, as the rules describe for a shuffle during play.
- **Stumble's Price is chosen when you lock Stumble,** and it is free when you hold no other ordinary card.
- **Recalculate needs a card in hand after the trick;** without one there is no prompt.
- **Statuses gained during a check wait for cleanup** as consequences. `gainStatus` refuses them during a check.

## Matching the simulations

The bots in `engine/bot.mjs` play like those in `scripts/simulate_tally.mjs`. The parity test runs 3,000 default-scene checks through the engine and requires every published rate in [TALLY_SIMULATIONS.md](../docs/alternatives/TALLY_SIMULATIONS.md) situation 1 to land within 3 points. `scripts/simulate_tally.mjs` stays the lab for rule experiments; the engine is the rules as adopted.
