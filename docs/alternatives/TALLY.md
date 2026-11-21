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
| **Standard** | 3 per player, +1 | 6–28 | **12** |
| **Quick** | 2 per player, +1 | 6–17 | **10** |
| **Solo** | 6 | 6–20 | **12** |

**The target sets the difficulty.** These odds are RULES.md's, from `npm run sim:targets`: standard checks with starter decks at 2–5 players. The first three columns are look-ahead bots, which replay the rest of the check before each card (the lab's Part 6); rough play is the rules engine's greedy bots:

| Target | Difficulty | Success or better | Exact hit | Failure: 7+ short | Rough play: success |
| --- | --- | --- | --- | --- | --- |
| 6–10 | Easy | 87–96% | 39–70% | 0–4% | 50–68% |
| 11–13 | Moderate | 69–92% | 26–55% | 2–12% | 30–54% |
| 14–16 | Hard | 47–78% | 17–42% | 7–34% | 19–35% |
| 17–19 | Very hard | 34–62% | 9–28% | 24–49% | 11–25% |
| 20–22 | Extreme | 21–48% | 5–20% | 40–63% | 4–16% |
| 23–25 | Heroic | 12–36% | 3–15% | 53–77% | 2–8% |
| 26–28 | Legendary | 6–26% | 1–11% | 66–86% | 1–5% |

The bands used to be named from the greedy bots, which made 15–20 very hard to extreme. Players who plan find the same odds about 8 targets higher, so the names moved up and the range ran to 29; the world's consolation then took back two or three targets, and it now runs to 28. A real table lands somewhere between the two columns. **6 is the lowest useful target:** below it, rough play's busts keep rising (to 23–34% at target 1) while success or better barely moves. Careful players almost never bust at any target; for them, a hard target means falling short.

- **Busts are a low-target, small-table risk.** At target 6, 19% of results bust at 2 players and 14% at 5. At target 20, 2–3% do. Under the old Slip, busts stayed at 0–13%, because every returned Spade was a spare card that couldn't win.
- **Larger tables hit more often.** At any given target, 5 players hit exactly about 10 points more often than 2.
- **The difficulty climbs smoothly.** Each step up in target is a little harder than the last, with no cliff.
- **Below 3, exact hits get harder again.** At targets 1 and 2 you must take exactly one low world card and then nothing else.
- **Different players can have different targets** in the same check, when their tasks differ. This hasn't been simulated, but players barely share scoring, so it should work.

## A check

1. **State your goal:** what you're doing and how. The suit it leans on is your **trump**.
2. **The GM sets its target** from the goal (you may suggest one), and the table agrees stakes.
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

Your losing card's printed suit gives its consolation, statuses included. Every consolation happens by itself, with nothing to choose: **the card you lose with is the decision.** There are no consolations after the final trick.

| Suit | Consolation |
| --- | --- |
| **Strength: Brace** | Your next card counts this card's value higher **for beating**. |
| **Dexterity: Shave** | **Your next card, if it wins, scores 1 less,** never below 0. |
| **Intelligence: Recalculate** | **Draw one card.** |
| **Weird: Mirror** | **Your next card counts 11 minus its value** for beating: a 2 counts 9, a 9 counts 2. What you score doesn't change, and statuses stay at 0. |

Brace, Shave and Mirror last for your next play only. Turn the losing card sideways as a reminder, and straighten it when you play.

Each suit does one job:

- **Strength:** *reach.* A small card can take a big world card.
- **Dexterity:** *precision.* Shave a win to land exactly on target.
- **Intelligence:** *options.* One more card to choose from.
- **Weird:** *invert the prize.* An easy world 2 scores 9; a hard world 10 scores 1.

**Losing on purpose** sets you up:
- **A losing Strength card is a Brace:** next trick, reach for a bigger world card than your hand could otherwise take.
- **A losing Dexterity card is a Shave:** next trick, a world card one higher than you need lands you exactly.
- **A losing Intelligence card is a Recalculate:** a card now, for a hand that needs more choices.
- **A losing Weird card is a Mirror:** your low cards become strong for one play, and your high cards become safe ways to lose.

**Changes from the old consolations:**
- **Brace** has no choice and can't stack.
- **Reposition became Slip, then Wait, then Peek.** Without follow-suit, Reposition overlapped Brace. Slip (return the card to hand) made losing free and kept spare cards in every hand, so it was replaced: see *Replacing Slip* in [TALLY_SIMULATIONS.md](TALLY_SIMULATIONS.md). Wait (choose after everyone else reveals) cut collisions but did nothing solo; Peek works at any table size and puts the world deck in play.
- **Revelation becomes Mirror.** The question and the status-suit option are gone, and with them the whole *Suit changes* section.
- **Recalculate** loses its reshuffle note, because evolution happens on any shuffle.
- **Peek became Shave, and Recalculate only draws** (consolations made automatic). See *Automatic consolations* below.

### Other candidates for Weird and Dexterity

| | Option | Effect | Trade-off |
| --- | --- | --- | --- |
| **Weird** | **Mirror** *(adopted)* | Your next card counts 11 minus its value for beating. | Plannable, double-edged: turns a weak hand strong or a strong hand safe. |
| | **Mirror the prize** *(replaced)* | The next world card you win scores 11 minus its value. | Changed what you score, which made tallies hard to read at the table. |
| | **Shift** | If any losing card this trick is Weird, discard the next world card and flip a replacement. | Changes the whole table's next trick, at random. |
| | **Echo** | If your next card wins, the world card scores double. | Big swings, real bust risk. |
| **Dexterity** | **Shave** *(adopted)* | Your next win scores 1 less. | Automatic and one line; helps exact hits in every scene (see below). |
| | **Shave by value** | Your next win scores this card's value less. | Strong in quick checks, a loss at high targets. |
| | **Peek** *(replaced)* | Choose, blind, whether to replace the next world card; once a trick if anyone does. | A secret choice, and it costs a table that plans: −5 to −11 points of success. |
| | **Peek, automatic** *(replaced)* | Any losing Spade replaces the next world card, unseen. | No choices, but rerolls the row under everyone's plans: worse than the choosing Peek. |
| | **Peek with a look** *(replaced)* | Look at the world deck's top card; you may swap it in. | Slightly better results, but a private choice per loser and an order to resolve them. |
| | **Wait** *(replaced)* | Choose your next card after everyone else reveals. | Cuts collisions between allies by about 30%, but useless solo. |
| | **Slip** *(replaced)* | Return this card to your hand. | Losing costs nothing; the spare cards hide most busts. |
| | **Reposition** | Next card can win whatever its suit. | Familiar, but overlaps Brace. |
| | **Feint** | Next card is on-suit, whatever its suit. | Worth nothing to players who plan: they rarely lack a way to win. |
| | **Undo, Weaken, Pocket, Dodge** | Give back a busting win; lower the next world card; score nothing next win; refuse a busting win. | Undo, Weaken and Pocket measured at nothing or less; Dodge was too fiddly to adopt. |

## Example

Target 10, a standard check.

**Ana** (Strength trump) is on 2 and needs exactly 8. The world leads 6♦, and an 8♠ is next. Her best Heart is a 5, which can't reach 8.
- **This trick:** she plays 4♥. It can't beat 6, so it loses, and she Braces for 4.
- **Next trick:** she plays 5♥, which counts 5 + 4 = 9 for beating. It beats the 8♠, nobody plays higher, and she scores the world card's 8: **exactly 10**.

**Cara** (Weird trump) is on 3 and needs 7. A 7♦ is coming up, and her hand is all low: 2♣, 3♣, 4♥.
- **The trick before it:** she loses with her 3♣, so her next card is Mirrored.
- **On the 7♦:** her 2♣ counts 11 − 2 = 9 and beats the 7. She scores the world card's 7: **exactly 10**.

**Ben** (Dexterity trump) is on 6 and needs 4. The next world card is a 5♠: one too many.
- **This trick:** he loses on purpose with his 2♠, so his next win is Shaved.
- **Next trick:** his 7♠ takes the 5♠, which scores 5 − 1 = 4: **exactly 10**.

## Statuses

**Statuses are ordinary cards worth 0.** They follow every rule, and their printed suit gives its consolation as usual. **If the world card's suit matches a status in your hand, you must play it**: the situation finds your weakness.

| Status | When it loses | Its own rule |
| --- | --- | --- |
| **Injury, Strength** | Brace for 0, which does nothing. | Two or more Injuries in your recent discard make survival a forced goal. |
| **Stumble, Dexterity** | Shave: your next win scores 1 less. | **Comes back:** at cleanup a played Stumble goes on top of your deck, so you draw it first next check. |
| **Stress, Intelligence** | Recalculate: draw a card. | Whenever you draw Stress, gain another Stress into discard. |
| **Curse, Weird** | Mirrors your next card. | Breaking the compulsion gains one Stress per Curse outside your reserve. |

- **A Braced status can win.** A 0 Braced by 6 beats a world 5, and you score the 5.
- **Late in a check, statuses are passes.** Once you're on target, a card that loses is useful. Statuses hurt early, as dead slots in a hand you need for winning, and between checks.

### Stumble

Stumble does nothing while it sits in your hand; its rule triggers **only when you play it**. A Dexterity world card forces it out, and then it **comes back**: at cleanup it goes on top of your deck instead of discard. Your next check opens with it in hand, and rest, which clears only discard, can't reach it. Like Stress's extra copies, its cost lands in later checks. A Stumble you hold but never play cleans up into discard as usual, so the way to be rid of one is a check with no Dexterity world card for it, then rest or evolution.

Stumble's Price (discard an ordinary card from hand, your choice) came before. It asked for a choice, and the overnight runs showed the choice barely mattered: discarding your lowest, a random or even your highest card all landed within 2 points. Older games keep it.

Within one check, comes back costs nothing beyond the forced play: in a worn party of look-ahead bots it matches having no Stumble rule (95 / 63 success / exact, against Price's 92 / 58). Sending it to the deck at once instead, where a Recalculate could draw it again mid-check, cost about half the Price (93 / 62); sending it back to hand cost as much as the Price (91 / 59).

| Variant | When you play Stumble | Cost |
| --- | --- | --- |
| **Comes back** *(adopted)* | At cleanup, it goes on top of your deck. | Your next check opens with it, and rest can't clear it. |
| **Price** *(before)* | Discard an ordinary card from hand, your choice. | Each pass costs a card. With no ordinary cards left, as on the final trick, it costs nothing. |
| **Back to hand** | It returns to your hand after the trick. | Forced out again by every Dexterity world card. |
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

## Automatic consolations

Consolations used to ask questions mid-trick: whether to Peek, which card to Recalculate. They now happen by themselves, so the only decision in play is the card you lose with. The choice of replacements came from `scripts/simulate_tally.mjs` (Parts 3e to 3g), played by **look-ahead bots** as well as the greedy ones: for each card in hand, a look-ahead bot replays the rest of the check many times, with what it can't see reshuffled, and plays the card that does best. They value a consolation by what it achieves, not by a hand-written tactic, so they stand in for players who use it well.

Points of success or better each consolation is worth to look-ahead bots, against the same rules without it (3 players, a hard target of 14, 2 players, a quick check):

| Consolation | 3 players | Hard | 2 players | Quick |
| --- | --- | --- | --- | --- |
| Brace | +5 | +12 | +6 | +1 |
| Mirror | +2 | +3 | +4 | 0 |
| Recalculate, discard one and draw one (replaced) | −1 | — | −1 | −2 |
| Recalculate, draw one (adopted) | +6 | — | +6 | +5 |
| Peek, choosing (replaced) | −9 | — | −5 | −1 |
| Shave, 1 (adopted) | 0 (+6 exact) | −1 (+3 exact) | 0 (+4 exact) | +6 (+12 exact) |

- **Anything that changes the shared row costs a table that plans.** Peek, an automatic Peek and swapping the next two world cards all scored at or below no consolation: one player's reroll undoes everyone else's plan.
- **The choice inside Recalculate was worth nothing:** discarding at random scored the same as choosing well. Drawing without discarding is worth about as much as Brace.
- **Dexterity effects that help you win (Feint, Weaken) added nothing;** players who plan rarely lack a way to win. Shave helps you score the right amount instead, and turns successes into exact hits.
- **Greedy bots misjudge consolations.** With them, removing Brace raised success, because a Brace pushed them into wins that bust; look-ahead bots gain from it everywhere.
- **Look-ahead bots reach 80–97% success and bust 0–5%,** far above the greedy bots. The difficulty table now takes its names from them.

## The world's consolation

When a player takes the world card, the world takes a consolation from that card's suit, on the next world card: **Brace** (it counts the taken card's value higher for beating), **Shave** (it scores 1 less), **Peek** (it goes under the world deck and the deck's top card takes its place) and **Mirror** (it counts 11 minus its value for beating). It is the players' rule turned around, and it fires on the tricks players win, so it pushes back hardest when a table is doing well.

It came from `scripts/simulate_tally.mjs` Part 7, which tried the world's consolations two ways: when the world takes a trick, and when it loses one. The table shows how many targets each is worth: how much higher a check without it must be set for the same success, over targets 13–28.

| Version | Look-ahead: 2p | 3p | 4p | 5p | Greedy: 2p | 3p | 4p | 5p |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| When the world takes, Brace by value | +1.0 | +1.4 | +1.0 | +1.0 | +0.2 | +0.5 | +0.4 | +0.5 |
| When the world takes, Brace 2 | +1.0 | +1.2 | +0.7 | +0.7 | 0 | +0.3 | +0.1 | +0.2 |
| When the world takes, Brace by value, plus Harden | +1.9 | +2.1 | +1.6 | +1.9 | +1.0 | +1.1 | +1.2 | +1.4 |
| **When the world loses, Brace by value** *(adopted)* | **+1.7** | **+2.2** | **+2.8** | **+2.9** | +0.8 | +1.2 | +1.4 | +1.1 |
| When the world loses, Brace 2 | +1.0 | +1.9 | +1.7 | +2.0 | +0.4 | +0.4 | +0.4 | +0.5 |

- **It costs careful play two to three times what it costs rough play,** because Peek and a big Brace break plans. That narrows the gap between the two columns of the difficulty table.
- **It grows with the table,** the opposite of the old bias: larger tables succeed more often, and this pushes back hardest on them.
- **Exact hits fall most** (up to 14 points at moderate targets), and busts don't move.
- The world's Intelligence consolation was first "no trump next trick", and Weird a symmetric Mirror; both tested at about 0 when the world takes. Peek replaced the first; Mirror stayed for symmetry.

## Dials to test

- **Visible row versus suspense.** Flipping each world card as its trick starts makes play quicker and riskier. A middle ground is showing only the next two.
- **Table-size adjustment.** Raise the target by 2 at 5 players to keep difficulty labels steady.
- **Threat pile:** as above.

## Open questions

- Does scoring only the world card make players feel their own cards matter enough?
- The difficulty bands are now named from look-ahead bots, with greedy bots' success beside them. Where do real tables land between the two?
- Solo checks still bust about a quarter of the time at targets 6–8. Do they need larger targets?
- Is Shave noticed at the table? Its value is in exact hits, which players only see at the end of a check.
- Is a Stumble that opens your next check enough to stop it being a free pass? Checks that follow one another closely feel it most; a long gap with rest doesn't clear it.
- Are fiction-based criticals and busts consistent enough between GMs? Groups may want a short table of examples per approach.
- Visible row or suspense: which feels better at the table?
