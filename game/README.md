# TRICK, digital

The rules of [RULES.md](../RULES.md) as code, and a host server for playing them with phones, as planned in [docs/digital/PLAN.md](../docs/digital/PLAN.md). Phases 1 (the engine) and 2 (the server and lobby) are done; the screens are still bare.

```bash
npm start            # host with a public link through a Cloudflare quick tunnel
npm run start:local  # host on this computer only
npm test             # engine rules, replay, card conservation, parity, and server tests
npm run sim:engine   # bots play the default scene through the engine (add a number of checks)
```

## Hosting a game

1. **Install cloudflared once** for the public link: on Windows, `winget install --id Cloudflare.cloudflared`. Without it, `npm start` still runs, local only.
2. **Run `npm start`.** It prints a private host page link (with an admin token) and a public `trycloudflare.com` link. The public link changes each time you start.
3. **On the host page,** create a campaign or open a saved one. Each campaign shows its room code, a QR code and join link for players, a link to the table screen, and the secret GM link.
4. **Players** scan the QR code or open the join link, enter a name, and create their character on their phone. A phone that sleeps or drops rejoins its seat automatically.
5. **The GM** opens the GM link, on a phone or the laptop. They can play a character too, set the seating, run checks, add consequences, and remove a seat.

Campaigns are saved in `game/saves/` (one file each, ignored by git) after every action, and replay exactly when reopened. Old join links keep working when the same campaign is opened again; the tunnel's address is new each time.

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
// … setGoal, declareApproach, approveApproach, deal, lockCard, peek, recalculate, addConsequence, endCheck
const phone = viewFor(game, { role: "player", charId: "ana" }); // only what Ana may see
```

- **`apply(state, action)`** returns `{ state, events }` and never changes its input. An illegal action throws a `RuleError` whose message is written for the player: "You must play your Stumble: the world card is Spades."
- **Randomness is seeded** and kept in the state, so `replay({ seed }, state.actions)` rebuilds any game exactly.
- **`viewFor(state, who)`** is the only thing a screen should receive. The table never sees a hand or the world deck. A phone sees its own hand, legal plays and prompts, and only the player Peeking sees the world deck's top card.
- **Events** describe what happened ("trickResolved" with the reason, "pricePaid", "survivalRequired") for the screens to animate.

Suits are `S` (Strength, Hearts), `D` (Dexterity, Spades), `I` (Intelligence, Diamonds) and `W` (Weird, Clubs). Every pile is an array whose top is its last element.

## Actions

| Action | When | Who |
| --- | --- | --- |
| `createCharacter { id, name, primary, secondary, others }` | Any time | A player. `others` lists the two remaining suits; the first takes 2, 3, 6, 9 |
| `setSeats { seats, gmSeat }` | Any time | GM |
| `beginCheck { kind, participants }` | No check running | GM. Runs the survival scan |
| `setGoal { charId, goal, target }` | Setup | GM. A survival goal's target is fixed at 3 × M |
| `declareApproach { charId, suit, approach }`, `approveApproach { charId, approved }` | Setup | The player, then the GM |
| `deal` | Setup | GM. Deals the world row and draws every hand |
| `lockCard { charId, cardId, priceCardId }`, `unlockCard { charId }` | Play | A player. The trick resolves when everyone with cards has locked |
| `peek { charId, swap }` | Consolation | The player whose Peek is active |
| `recalculate { charId, cardId }` | Consolation | A player who lost with a Diamond |
| `giveBlessed { charId, to, cardId }` | Between tricks | A player holding a Blessed |
| `evolve { charId, skip \| suit, mode, cardId }`, `evolvePick { charId, cardId }` | When a draw reshuffles and evolution is possible | That player |
| `addConsequence { charId, suit, compulsion }`, `endCheck` | After the final trick | GM |
| `gainStatus`, `curseViolation`, `rest`, `grantBlessed` | Between checks (`grantBlessed` any time) | GM |

The server checks who may send which action: see *The server* above.

## Rulings the engine makes

Where RULES.md leaves a detail open, the engine decides as follows. Each is covered by a test, and any of them can change:

- **Peeks resolve one at a time, clockwise from the GM.** The GM's position is `gmSeat` in the seating order. Each Peek sees the world deck as the previous one left it, and a Peek is skipped when the world deck is empty.
- **A played Blessed returns to its owner's reserve,** even after being given to another player.
- **A player's card equal to the world card doesn't beat it:** the world takes the trick.
- **Evolution in preparation follows the main procedure:** the remaining status, and a gained card, stay in discard and shuffle in. **Mid-check**, they are set aside and land on top of the new discard, as the rules describe for a shuffle during play.
- **Stumble's Price is chosen when you lock Stumble,** and it is free when you hold no other ordinary card.
- **Recalculate needs a card in hand after the trick;** without one there is no prompt.
- **Statuses gained during a check wait for cleanup** as consequences. `gainStatus` refuses them during a check.

## Matching the simulations

The bots in `engine/bot.mjs` play like those in `scripts/simulate_tally.mjs`. The parity test runs 3,000 default-scene checks through the engine and requires every published rate in [TALLY_SIMULATIONS.md](../docs/alternatives/TALLY_SIMULATIONS.md) situation 1 to land within 3 points. `scripts/simulate_tally.mjs` stays the lab for rule experiments; the engine is the rules as adopted.
