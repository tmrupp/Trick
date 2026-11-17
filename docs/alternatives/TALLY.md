# Tally: beat the world, land on the number

Tally is a check system for **TRICK** (Tabletop Roleplaying Interactive Card Kit). The item cards in [items/](../../items/README.md) follow it.

Design notes and simulations for the check in [RULES.md](../../RULES.md). It builds on the core of [SIMPLER_CHECKS.md](SIMPLER_CHECKS.md): the world always leads, and everyone answers at once.

**The world card is both the difficulty and the prize.** Only one player takes each trick: the single highest card on the table, if it is on-suit and beats the world card. That player scores **the world card's value**. Everyone else takes a consolation, all at the same time. You are trying to land your tally exactly on a target. Hitting it is a critical success. The further short you fall, the worse the result. Going over is a critical failure.

**To play it:** print the two-page [playtest sheet](tally_sheet.pdf) (source: [tally_sheet.html](tally_sheet.html)).

Persistent decks, statuses, evolution, survival and Blessed carry over from [RULES.md](../../RULES.md). Leading, follow-suit and personal-trump comparisons are gone, and the consolations are mostly the old ones.

## Outcomes

| Final tally | Result |
| --- | --- |
| **Exactly the target** | **Critical success.** You get it, and more: the GM adds a benefit that fits the fiction. |
| **1–3 short** | **Success, with a minor complication.** |
| **4–6 short** | **Partial success, with a serious complication.** It may be a status. |
| **7 or more short** | **Failure.** |
| **Over the target** | **Bust: critical failure.** It goes wrong, loudly: the GM sets a consequence that fits the fiction, which may be a status. |

The ladder runs in fixed steps of 3, so being short costs the same at any target. Low targets are forgiving: at target 3 or 6 you can't fall 7 short. High targets are where outright failure lives.

Among incompatible goals, the better step wins. Within the same step, the tally closer to its target wins. A tie produces the agreed stalemate.

## Check size and target

| Check | Tricks | Targets | Default |
| --- | --- | --- | --- |
| **Standard** | 3 per player, +1 | 6–20 | **10** |
| **Quick** | 2 per player, +1 | 6–12 | **6** |
| **Solo** | 6 | 6–12 | **6** |

**The target sets the difficulty.** These odds come from simulated standard checks with random 21-card decks, at 2–5 players:

| Target | Difficulty | Exact hit | Failure: 7+ short | Bust |
| --- | --- | --- | --- | --- |
| 6–8 | Easy | 18–27% | 0–10% | 13–18% |
| 9–11 | Moderate | 12–23% | 10–20% | 9–14% |
| 12–14 | Hard | 8–16% | 22–39% | 7–10% |
| 15–17 | Very hard | 4–11% | 39–59% | 4–6% |
| 18–20 | Extreme | 2–7% | 55–74% | 2–4% |

These use Peek as Dexterity's consolation. **6 is the lowest useful target:** below it, busts keep rising (to 22–32% at target 1) while success or better barely moves.

- **Busts are a low-target, small-table risk.** At target 6, 18% of results bust at 2 players and 14% at 5. At target 20, 2–3% do. Under the old Slip, busts stayed at 0–13%, because every returned Spade was a spare card that couldn't win.
- **Larger tables hit more often.** At any given target, 5 players hit exactly about 10 points more often than 2.
- **The difficulty climbs smoothly.** Each step up in target is a little harder than the last, with no cliff.
- **Below 3, exact hits get harder again.** At targets 1 and 2 you must take exactly one low world card and then nothing else.
- **Different players can have different targets** in the same check, when their tasks differ. This hasn't been simulated, but players barely share scoring, so it should work.

## A check

1. **Agree goals, targets and stakes.**
2. **Declare an approach.** Its suit is your **trump**.
3. **Deal the world's cards face-up in a row,** one per trick, from the GM's shuffled A–10 deck. **Everyone draws** the same number.
4. For each trick:
   1. **The world leads** its next card.
   2. **Everyone picks a card face-down,** then all reveal together. No tactical talk.
   3. **Win:** find the **single highest card on the table**, counting the world card and any Brace. If it's a player's card, and in the world card's suit *or* its owner's trump, it wins. **Its owner scores the world card's value.** If players tie for highest, a card in the world card's suit and its owner's trump beats one in the world card's suit only, which beats trump only. Otherwise **the world takes the trick**: the world card is highest, the highest card is off-suit, or the tie stays level.
   4. **Lose:** everyone else takes their card's **consolation**, all at once, before the next world card.

The winner has to beat everyone. **A high off-suit card can't win, but it blocks:** nobody beats it, so the world takes the trick.

**Winning isn't optional.** If your card is the highest on the table and on-suit, you take the world card, even if it busts you. To stay safe, play low, or let someone play over you.

Your own card's value only decides whether you win. **What you score is chosen by which world card you take.** With the whole row visible, the core decision is which world cards to go after, and which to leave for allies.

## Consolations

Your losing card's printed suit gives its consolation, statuses included. There are no consolations after the final trick.

| Suit | Consolation |
| --- | --- |
| **Strength: Brace** | Your next card counts this card's value higher **for beating**. |
| **Dexterity: Peek** | Look at the top card of the world deck. You may **swap it for the next world card**; the replaced card goes to the bottom of the world deck. Several Peeks resolve one at a time, clockwise from the GM. |
| **Intelligence: Recalculate** | Discard one card from hand, then draw one. |
| **Weird: Mirror** | If your next card wins, **the world card scores 11 minus its value.** |

Brace and Mirror last for your next play only; Peek happens at once. Turn the losing card sideways as a reminder, and straighten it when you play.

Each suit does one job:

- **Strength:** *reach.* A small card can take a big world card.
- **Dexterity:** *timing.* See the table, then take the world card cleanly or stay out of an ally's way.
- **Intelligence:** *fix the hand.* Swap out a card you can't use.
- **Weird:** *invert the prize.* An easy world 2 scores 9; a hard world 10 scores 1.

**Losing on purpose** sets you up:
- **A losing Strength card is a Brace:** next trick, reach for a bigger world card than your hand could otherwise take.
- **A losing Dexterity card is a Peek:** throw out a world card that would bust you or that nobody can use, or bring in one that fits.
- **A losing Weird card is a Mirror:** a low world card coming up becomes a big score, or a big one a small, safe score.

**Changes from the old consolations:**
- **Brace** has no choice and can't stack.
- **Reposition became Slip, then Wait, then Peek.** Without follow-suit, Reposition overlapped Brace. Slip (return the card to hand) made losing free and kept spare cards in every hand, so it was replaced: see *Replacing Slip* in [TALLY_SIMULATIONS.md](TALLY_SIMULATIONS.md). Wait (choose after everyone else reveals) cut collisions but did nothing solo; Peek works at any table size and puts the world deck in play.
- **Revelation becomes Mirror.** The question and the status-suit option are gone, and with them the whole *Suit changes* section.
- **Recalculate** loses its reshuffle note, because evolution happens on any shuffle.

### Other candidates for Weird and Dexterity

| | Option | Effect | Trade-off |
| --- | --- | --- | --- |
| **Weird** | **Mirror** *(recommended)* | The next world card you win scores 11 minus its value. | Plannable, double-edged. |
| | **Shift** | If any losing card this trick is Weird, discard the next world card and flip a replacement. | Changes the whole table's next trick, at random. |
| | **Echo** | If your next card wins, the world card scores double. | Big swings, real bust risk. |
| **Dexterity** | **Peek** *(adopted)* | Look at the world deck's top card; you may swap it for the next world card. | Helps at every table size, solo included; acts about once in three losses. |
| | **Wait** *(replaced)* | Choose your next card after everyone else reveals. | Cuts collisions between allies by about 30%, but useless solo. |
| | **Slip** *(replaced)* | Return this card to your hand. | Losing costs nothing; the spare cards hide most busts. |
| | **Reposition** | Next card can win whatever its suit. | Familiar, but overlaps Brace. |
| | **Feint** | Next card wins if it *equals* the world card, not only if it beats it. | Small; possibly too weak. |

## Example

Target 10, a standard check.

**Ana** (Strength trump) is on 2 and needs exactly 8. The world leads 6♦, and an 8♠ is next. Her best Heart is a 5, which can't reach 8.
- **This trick:** she plays 4♥. It can't beat 6, so it loses, and she Braces for 4.
- **Next trick:** she plays 5♥, which counts 5 + 4 = 9 for beating. It beats the 8♠, nobody plays higher, and she scores the world card's 8: **exactly 10**.

**Cara** (Weird trump) is on 3 and needs 7. A 4♣ is coming up.
- **The trick before it:** she loses with a Weird card, so her next win is Mirrored.
- **On the 4♣:** her 5♣ wins, and the world card scores 11 − 4 = 7: **exactly 10**.

**Ben** (Dexterity trump) is on 6 and needs 4. The next world card is a 9♦, which nobody can use without busting.
- **This trick:** his 2♠ loses, so he Peeks: the world deck's top card is 4♠. He swaps it in, and the 9♦ goes to the bottom of the world deck.
- **Next trick:** his 7♠ takes the 4♠: **exactly 10**.

## Statuses

**Statuses are ordinary cards worth 0.** They follow every rule, and their printed suit gives its consolation as usual. **If the world card's suit matches a status in your hand, you must play it**: the situation finds your weakness.

| Status | When it loses | Its own rule |
| --- | --- | --- |
| **Injury, Strength** | Brace for 0, which does nothing. | Two or more Injuries in your recent discard make survival a forced goal. |
| **Stumble, Dexterity** | Peek at the world deck. | **Price:** when you play Stumble, discard an ordinary card from hand, your choice. |
| **Stress, Intelligence** | Recalculate. You may discard another status. | Whenever you draw Stress, gain another Stress into discard. |
| **Curse, Weird** | Mirrors your next win. | Breaking the compulsion gains one Stress per Curse outside your reserve. |

- **A Braced status can win.** A 0 Braced by 6 beats a world 5, and you score the 5.
- **Late in a check, statuses are passes.** Once you're on target, a card that loses is useful. Statuses hurt early, as dead slots in a hand you need for winning, and between checks.

### Stumble

Stumble does nothing while it sits in your hand; its rule triggers **only when you play it**. A Dexterity world card forces it out, and **Price** makes each of those plays cost an ordinary card. Under Slip, a losing Stumble went back to hand and could be forced out again and again; now it is spent, so Price is paid about 0.4 times a check in a worn party, down from about once.

| Variant | When you play Stumble | Cost |
| --- | --- | --- |
| **Price** *(recommended)* | Discard an ordinary card from hand, your choice. | Each pass costs a card. With no ordinary cards left, as on the final trick, it costs nothing. |
| **Fumble** | Gain another Stumble into discard. | Cost lands in later checks, and compounds. |
| **Shaky** | Landing exactly counts as 1–3 short for the rest of the check. | Costs your critical, once. |
| **Snag** | The GM adds one complication to your result. | Narrative; work for the GM. |

### Where statuses come from

- **A bust's consequence may be a status,** chosen from the fiction rather than by your trump suit. A Curse from a bust names its compulsion after what went wrong.
- **4–6 short:** the serious complication may be a status.
- **Criticals and busts are fiction-based.** They used to shed a non-Curse status and gain your trump's status. Tying them to the fiction keeps a Strength player's busts from always meaning Injury, and lets a critical pay off in the scene.

Rest and evolution still remove statuses as before. Curses still leave only through evolution.

## How it fits the rest of Trick

- **Blessed** always takes the trick and scores the world card. Two Blessed tie, so the world takes it.
- **Survival** is a forced goal with target **3 per Injury** counted in the scan: 6 for two Injuries, 9 for three, 12 for four, 18 for six. A bust, or landing 7 or more short, is death: about 14%, 20%, 28%, 44% and 63% for two to six Injuries in simulation. At two Injuries the target is 6, so only a bust kills. Anything else is survival, at that step's cost.
- **Evolution and rest** are unchanged.
- **Deck building shifts to reach and suit.** High cards take big world cards; suit spread lets you be on-suit more often. Card values no longer need to add up to anything.

## Interaction

With one winner per trick, allies want the same world cards, and that brings back losing to help:

- **Yield.** If an ally needs this world card, play low. You still get your consolation.
- **Block.** If taking this world card would bust an ally, play over them, even off-suit.
- **Collide.** An ally's high card can block your win. Without talk, reading each other is the skill.

**Threat pile (optional dial).** World cards the world takes go to a threat pile. If its total reaches a threat number, the danger lands on everyone.

## How the scoring was chosen

Scoring the winner's own card made a cliff at 11: one card can't score more than 10, so exact hits fell from 35% at target 10 to 7% at 11, then rose again. These alternatives were simulated (3 players, random decks, under the old Slip):

| Scoring | Exact hit by target | Verdict |
| --- | --- | --- |
| Your card | 6–10: 36–41%; 11: 6%; 15–17: 21%; 20: 9% | Cliff and dip |
| Your card, Brace also scores | 11: 16% | Shallower cliff |
| Your card plus world card when matching the world's suit | 6–10: ~36%, 11–20: 15–21% | Two flat steps |
| Your card plus world card | Peaks at 44% at 11, then falls to 14% at 20 | Smooth above 11, harder below |
| **World card only** *(adopted)* | 3–6: ~30%, then steadily down to 4% at 20 | **Smooth all the way** |

## Simulation notes

The current numbers, under every adopted rule, are in [TALLY_SIMULATIONS.md](TALLY_SIMULATIONS.md). These notes record how the check was sized, under the old Slip.

- **The bots** are grabby: each takes any win that doesn't bust it, and otherwise plays its lowest card. They don't anticipate one another. People planning around the visible row should hit exactly more often.
- **The decks** are random 21-card decks from the A–10 cards of two standard decks, with trump set to the deck's biggest suit. Adding 0–4 random statuses moved results by 1–2 points.
- **Quick checks** at 1 trick per player + 1 almost never landed exactly (≤10%). At 2 per player + 1 they hit 15–23% at targets 3–8.
- **Solo checks** at 4 tricks hit about 20% and busted about 20%. At 6 tricks they hit 28–34% at targets 3–7.

## Dials to test

- **Visible row versus suspense.** Flipping each world card as its trick starts makes play quicker and riskier. A middle ground is showing only the next two.
- **Table-size adjustment.** Raise the target by 2 at 5 players to keep difficulty labels steady.
- **Threat pile:** as above.

## Open questions

- Does scoring only the world card make players feel their own cards matter enough?
- Is Peek worth enough? The Dexterity-trump player still lags the others by a few points of success or better in simulation.
- Solo checks still bust about a quarter of the time at targets 6–8. Do they need larger targets?
- Peek changes the row for everyone. Does a swap that takes away a card an ally wanted feel like a collision of its own?
- Is Price steep enough to stop Stumble being a free pass?
- Are fiction-based criticals and busts consistent enough between GMs? Groups may want a short table of examples per approach.
- Visible row or suspense: which feels better at the table?
