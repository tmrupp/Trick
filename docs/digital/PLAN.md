# TRICK at the table: a phone-controlled digital version

A plan for playing TRICK's Tally checks with one computer as the shared table and each player's phone as their private hand. It works like a party game: the computer shows the room a big screen, and players join from their phones by scanning a code. No app install, no accounts.

[RULES.md](../../RULES.md) stays the single source. The digital version enforces the card rules and leaves the fiction (goals, approaches, complications, criticals and busts) to the GM and players.

## What it should feel like

- **The big screen is the table.** It shows the world row, every player's tally pile and distance to target, who has locked in a card (never which card), the reveal, and why the trick went the way it did: "Ana's 7♥ beats the world 5♥", "blocked by Ben's off-suit 9♣", "tie: Cara's card matches the world suit and her trump".
- **The phone is your hand.** Big, tappable cards; tap to choose, tap again to lock. The phone shows only legal plays, so a forced status is the only card you can pick when it applies. Private moments stay private: what you see when you Peek, which card you discard to Recalculate or to pay Stumble's Price.
- **Play is simultaneous.** Everyone locks in, then all cards flip together on the big screen. Talk is open before drawing and after the check; keeping quiet during play is the table's habit, enforced at the GM's discretion, not the software's.
- **The GM runs the fiction from their own phone or the host computer:** setting goals, targets and stakes; judging approaches; choosing complications and statuses; granting Blessed and rest.

## Scope

**Version 1: online sessions with persistent characters.**
- Lobby: the host starts a room, and phones join over the internet by link, QR code or a four-letter room code.
- Characters: players create their own on their phones: a name, primary and secondary suit, and the starter deck. Reserve, discard and statuses carry between checks.
- Saves: the host keeps several campaigns and picks one to load.
- The GM can also play a character, from the join link in another tab.
- Checks: standard, quick and solo, every rule in RULES.md from *Start a check* through *Survival*.
- GM tools: goals and targets, forced goals, approach approval, consequences, rest, Blessed grants, and Curse compulsions recorded as text.

**Later:** items and races, spectators, sound, and printing a player's current deck.

**Not planned:** an automated GM. The fiction is the game; the software handles the cards.

## Architecture

```text
 Phones (browser)                Host computer (one Node process)               Big screen (browser)
 ───────────────                 ───────────────────────────────                ────────────────────
 /play  ◄── WebSocket ──►  server: rooms, seats, reconnects   ◄── WebSocket ──►  /table
 /gm    ◄── WebSocket ──►  engine: pure rules functions, seeded RNG
                           store: campaign JSON on disk
```

- **One Node process** on the host serves the pages and a WebSocket. It is the only place game state lives, so it is the authority on every rule.
- **Each client gets only what it may see.** A phone receives its own hand and the public table, never another player's hand or the world deck. The big screen gets only public state.
- **No build step.** The repo is already plain ES modules and browser scripts; the pages stay that way. Two small dependencies: [`ws`](https://www.npmjs.com/package/ws) for WebSockets and [`qrcode`](https://www.npmjs.com/package/qrcode) for the join code.
- **Reuse what exists:**
  - `suit_icons.js` for suit marks and inks;
  - `card_base.css`, `deck_cards.css` and `card_renderer.js` as the starting point for on-screen cards;
  - `card_rules.js`, built from RULES.md, for consolation and status text on cards;
  - `scripts/rules_source.mjs` to read tables from RULES.md, so card text never drifts;
  - `scripts/simulate_tally.mjs`, whose trick resolution becomes the engine's first draft.
- **Online first.** The same Node server runs either on the host computer, exposed through a tunnel such as Cloudflare Tunnel, or on a small cloud host. Phones join by link from anywhere; nobody needs to share a network. Rooms need short codes, rate-limited joins and reconnect tokens from the start.
- **Start with `npm start`.** It prints the join link and opens the big screen.

### Folder layout

```text
game/
  engine/      pure rules: deck, check, trick, consolations, statuses, resolve, survival, evolution
  server/      HTTP + WebSocket, rooms, seats, reconnect tokens, per-client views, save/load
  public/
    table/     big screen
    play/      phone hand
    gm/        GM controller
    shared/    card component, suit icons, styles
  test/        engine unit tests, protocol tests, bot games, browser tests
```

## The engine

Pure functions over plain data, with a seeded random number generator so any game can be replayed exactly from its seed and its list of actions.

**State:**
- **Campaign:** characters (name, primary, secondary, deck, discard, reserve, Blessed held, Curse compulsion), the GM, and a log.
- **Check:** kind and size, the world row and the world deck, each participant's goal, target, approach, hand, played row, tally pile, and pending effects (Brace, Mirror), plus the trick in progress.

**Actions** are what clients send; the engine validates each one and returns the new state plus events for the screens to animate:
- setup: `setGoal`, `declareApproach`, `approveApproach`, `startCheck`;
- each trick: `lockCard`, then automatic `reveal` and `resolveTrick`;
- consolations: `peekSwap` or `peekKeep`, `recalculateDiscard`, `payPrice`;
- `giveBlessed`, `grantBlessed`;
- after the check: `applyConsequence`, `cleanup`, `rest`, `evolve`, and the survival scan.

**Rules the engine must settle in code.** Each needs a test, and some need a sentence added to RULES.md:
- the forced status choice when several match the world card's suit;
- Stumble's Price on the final trick, when it costs nothing;
- the Peek order (no longer needed: Peek is blind and happens once a trick, so seats have no order in play);
- a reshuffle mid-trick, with evolution, set-aside statuses and Stress draws chaining;
- a Blessed given between tricks, and the giver's replacement draw;
- incompatible goals and stalemates when results tie;
- survival scans at check start and on Injury gains, locking M, and reusing a recorded requirement.

**A parity test keeps the engine and the simulations together:** engine bots play the default scene and must land within 3 points of every rate published in [TALLY_SIMULATIONS.md](../alternatives/TALLY_SIMULATIONS.md). The simulator stays the lab for rule experiments.

## The screens

**Big screen (`/table`):**
- the room code and QR until everyone joins, then the table;
- the world row with the current card raised;
- one lane per player: name, approach (trump), tally pile, target and distance, lock-in light, any Brace or Mirror pending, and Blessed held;
- the reveal: cards flip together, the winner slides the world card into their pile, and a one-line reason appears;
- the result ladder at the end of the check, then the cleanup and survival scan.

**Phone (`/play`):**
- join with a name; rejoin automatically after the phone sleeps, using a token kept on the phone;
- character setup: primary and secondary suit, and which other suit takes 2, 3, 6, 9;
- each check: state your goal and the suit it leans on, see the target the GM sets, then your hand;
- each trick: legal cards only, tap to choose, tap to lock, and undo until everyone locks;
- prompts: Peek ("keep the 9♦ or swap in the 4♠?"), Recalculate, Stumble's Price, giving a Blessed;
- your deck, discard and reserve between checks, and evolution choices on a reshuffle.

**GM (`/gm`, phone or laptop):**
- set each goal, target, check size and stakes, with the difficulty table beside the target picker;
- set each target from the player's goal, start the check, pause it;
- during play, see the full table and every hand, for rulings;
- after the check, record complications, give statuses, name Curse compulsions, grant rest and Blessed.

## Message protocol

JSON over one WebSocket per client.

- **Client to server:** `{ "type": "action", "action": "lockCard", "cardId": "D-7", "seq": 42 }`
- **Server to client:** `{ "type": "view", "state": { … only what this client may see … }, "events": [ … ] }`
- **Errors:** `{ "type": "rejected", "seq": 42, "reason": "You must play your Stumble: the world card is a Spade." }`

Every view is complete, so a phone that reconnects just draws the latest one. Events drive animations and are safe to drop.

## Build order

| Phase | Builds | Done when |
| --- | --- | --- |
| **1. Engine** *(done: [game/](../../game/README.md))* | Rules as pure functions, seeded RNG, action log, per-client views, bots, tests for every rule in RULES.md. | A whole check plays from a script with bots, and the parity test passes. |
| **2. Server and lobby** *(done)* | Rooms, join by QR or code, seats and order, reconnect tokens, per-client views, save and load. | Five phones join, one sleeps and returns to the same seat, and no client ever receives another's hand. |
| **3. A playable check** *(built; awaiting a real table test)* | Big screen, phone hand and GM controller for one check: setup, tricks, reveal, consolations, statuses, result. | A table of three plays a standard check start to finish with no rules lookups. |
| **4. Between checks** *(built)* | Cleanup, discard and reshuffle, evolution, rest, survival scans, Blessed, Curses, and a saved session. | A session of several checks, with Injuries and a survival check, resumes after the host restarts. |
| **5. Playtest build** *(built, except real playtests)* | Reveal animation and pacing, a "why did that happen" line for every trick, a rules sheet on the phone, accessibility. | Real playtests, which the simulations keep asking for. |
| **6. Items and races** *(built: GM-applied effects)* | Catalog-driven effects at their timing anchors, with a "GM applies it" fallback for fiction-heavy items. | Every item in `items/item_catalog.js` is playable, automatically or through the GM. |
| **7. Beyond the room** *(built: spectators, cloud deploy files, download, import, archive, printing)* | Play over the internet through a tunnel, spectators, sound, a campaign archive. | A remote player joins a session. |

Phases 1–3 give a usable playtest tool. Phase 1 is the largest single piece and the foundation for everything else.

## Testing

- **Engine:** unit tests per rule, plus property tests that every card is always in exactly one place and that hidden information never appears in a public view.
- **Bot games:** thousands of seeded checks through the engine, compared with the simulator's published numbers.
- **Protocol:** scripted WebSocket clients that join, play, drop and rejoin.
- **Browsers:** Playwright, already a dependency, drives one big-screen page and several phone-sized pages in the same test.

## Risks

- **Phones sleep and drop the connection.** Seats must survive that, and the game should wait gracefully for anyone missing.
- **Hidden information leaks easily.** Build per-client views from day one, and test that a phone never receives another hand or the world deck.
- **Rules gaps surface in code.** The list above is a start; each one found becomes a test and, where needed, a line in RULES.md.
- **Items are open-ended.** Many are fiction-first. A GM-applied fallback keeps them from blocking the core game.
- **Exposure to the internet.** Rooms are reachable by anyone with the link, so codes must be hard to guess, joins rate-limited, and the GM able to remove a seat.

## Decisions

1. **The GM can play a character** as well as run the game, by joining in another tab like any player. The GM screen has no separate section for it.
2. **Several saved campaigns,** chosen when the host starts.
3. **Players create their own characters** on their phones.
4. **No table-talk banner.** The rule is implied, and enforcing it is up to the GM.
5. **Online play first,** not local-network only.
