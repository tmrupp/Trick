# Tally in simulated play

Thirteen table situations and seven experiments, run under the current [RULES.md](../../RULES.md):
- the 20-card starter has two of each value;
- Peek is Dexterity's consolation;
- ties go by suit, then trump;
- a status in the world card's suit must be played;
- survival targets 3 × Injuries.

Each line is 20,000 checks. Two simulators produce the numbers:

```bash
node scripts/simulate_tally.mjs 20000
node scripts/simulate_targets.mjs 6000
```

[`simulate_tally.mjs`](../../scripts/simulate_tally.mjs) runs the table situations and experiments with fresh starter decks. [`simulate_targets.mjs`](../../scripts/simulate_targets.mjs) runs every target from 1 to 20 with random 21-card decks, for the difficulty table in RULES.md.

**The bots are simple.**
- A bot takes a world card when it can beat it without busting, using its lowest winning card.
- Otherwise it passes with the card it values least, in this order: statuses, then Dexterity and Weird, then Strength, then Intelligence, then Stumble last.
- A Peeking bot swaps in the world deck's top card when that card suits it better than the next card in the row. That means clearing a card it can't use or that would force a busting win, or bringing in one that fits what it still needs.
- Cooperative bots in situation 2 also skip a world card that would land an ally exactly.

No bot reads another player's hand or plans more than one trick ahead. So **compare situations with each other rather than treating any number as table odds.** People should land exactly more often.

Earlier runs are in this file's history: commit `a6755b4` under Slip, and `8c995a9` under Wait. Both used the old 21-card starter.

## Results

Each row is one player:
- **Critical** is exactly on target.
- **Success** is 1–3 short.
- **Partial** is 4–6 short.
- **Failure** is 7 or more short.
- **Bust** is over the target.

Unless stated, players use fresh 20-card starter decks whose primary suit is their trump.

### 1. Default scene: 3 players, standard check (10 tricks), target 10

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana (Strength) | 21% | 44% | 18% | 7% | 10% |
| Ben (Dexterity) | 15% | 39% | 22% | 16% | 9% |
| Cara (Intelligence) | 15% | 36% | 19% | 11% | 19% |

The world takes 48% of tricks. More than half of all results are success or better, and about 1 in 8 busts.

### 2. The same scene, with allies yielding

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana | 22% | 40% | 18% | 10% | 10% |
| Ben | 16% | 36% | 21% | 18% | 10% |
| Cara | 16% | 33% | 18% | 13% | 20% |

Yielding adds about 1 point of critical but also 2–3 points of failure. Standing aside without knowing what allies hold is a weak tool.

### 3. Mixed stakes: per-player targets in one check

| Player | Target | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- | --- |
| Ana: hold the door | 6 | 25% | 42% | 17% | 0% | 16% |
| Ben: lift the keys | 10 | 14% | 39% | 21% | 16% | 10% |
| Cara: talk down the sheriff | 16 | 8% | 25% | 21% | 40% | 7% |

The target sets the difficulty as intended. An easy target can't fail outright, but it busts most.

### 4–5. A party of four, worn down or clean (13 tricks, target 10)

| Player | Worn: critical | Worn: failure | Worn: bust | Clean: critical | Clean: failure | Clean: bust |
| --- | --- | --- | --- | --- | --- | --- |
| P1 (Strength) | 19% | 7% | 9% | 23% | 5% | 9% |
| P2 (Dexterity) | 14% | 17% | 8% | 16% | 16% | 7% |
| P3 (Intelligence) | 14% | 12% | 17% | 14% | 11% | 17% |
| P4 (Weird) | 17% | 12% | 14% | 18% | 11% | 14% |

In the worn party, each deck carries an Injury, a Stumble and a Stress. That costs up to 4 points of critical, most for the Strength player, who carries an Injury in their trump suit. Each player is forced to play a status about once a check, and pays Stumble's Price 0.4 times a check.

### 6–7. Survival at target 3 × Injuries

| Survivor | Target | Critical | Success | Partial | Failure | Bust | Death |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Two Injuries | 6 | 25% | 42% | 20% | 0% | 13% | **13%** |
| Three Injuries | 9 | 21% | 41% | 19% | 10% | 9% | **19%** |

The survivor's two allies play their own target-10 goals. At target 6, falling 7 short is impossible, so only a bust kills. See *Survival* below for two to six Injuries.

### 8–10. Small tables, quick checks, solo

| Situation | Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- | --- |
| 8. Two players, 7 tricks, target 10 | Ana (Strength) | 17% | 40% | 21% | 12% | 10% |
| | Ben (Dexterity) | 13% | 36% | 23% | 18% | 11% |
| 9. Quick check, 3 players, 7 tricks, target 6 | Ana | 18% | 38% | 34% | 0% | 9% |
| | Ben | 16% | 34% | 40% | 0% | 9% |
| | Cara | 16% | 33% | 36% | 0% | 16% |
| 10. Solo, 6 tricks, target 6 | Ana | 26% | 37% | 11% | 0% | **25%** |

- **Two players** is the hardest standard table: the fewest exact hits and the most failures.
- **Quick checks are partial-heavy.** More than a third of results land 4–6 short, and none can fail at target 6.
- **Solo checks bust a quarter of the time.** The world takes 70% of tricks, and late in the check every card left can be a forced win. Peek helps the soloist clear a card that would bust them, but not enough.

### 11. Opposed goals: two players, 7 tricks, both at target 10

Ana (Strength) wins **51%**, Ben (Dexterity) **41%**, and **9%** are a stalemate. Both players have the same target. The gap is Strength's edge (see Findings).

### 12. Late campaign: 3 players with drifted decks

These decks are 21 random cards from A–10 instead of the starter. Critical is 13–17%, failure 13–17% and bust 7–18%, a little harder than the starter. Evolution keeps decks in this range, so expect results to drift slightly toward it over a campaign.

### 13. Hidden world values

In this variant, each world card's suit shows but its value stays hidden until everyone reveals.

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana | 7% | 34% | 30% | 12% | 17% |
| Ben | 6% | 31% | 29% | 20% | 14% |
| Cara | 7% | 31% | 25% | 12% | 25% |

Hiding the values cuts exact hits to 6–7%, and busts rise to 14–25%. It works as a dial for tense scenes, not a default.

## Findings

1. **Checks are hard but readable.** At the default target in a three-player check:
   - more than half of results are success or better;
   - 15–21% are exact;
   - 9–19% bust.

   Larger tables do a little better.
2. **Strength looks strongest.** Strength players land exactly 19–23% of the time in three- and four-player checks, against 14–18% for the others, and win the opposed check 51% to 41%. Brace's reach is the strongest consolation now that no consolation keeps cards.
3. **Dexterity players fall short most:** 16–18% failure. A Peek only changes the next world card, and it pays off for its user about 0.3 times a check.
4. **Intelligence players bust most (17–19%).** Part of this is the bot: Recalculate drops its lowest card, so the hand fills with high cards that win when it doesn't want to. People may handle that better.
5. **Collisions are constant.** Hands are hidden and nobody talks, so 92–98% of checks see at least one player lose a world card they went for. In the default scene, each player per check:
   - loses 1.3–1.6 world cards to an ally who played higher;
   - loses 0.6–0.7 to a tie;
   - loses 0.4–0.5 to an off-suit block;
   - and has 0.1–0.2 forced wins they didn't want.

   Forced wins are the main source of busts. *Reducing collisions* below tests rule changes aimed at this.
6. **The tie-break matters.** In a three-player check, players tie for the top card about 1.6 times a check, and 1.0 of those ties are all on-suit. Suit-then-trump settles about two-thirds of the on-suit ones (68% at 3 players, 76% at 4).
7. **Statuses cost something mainly because they must be played.** Held statuses barely matter. Forced play costs about 2 points of critical (see *Statuses*).
8. **Busts are part of the game now.** Under the old Slip, every returned Spade was a spare card that couldn't win, so busts were about 1% at the default target. Now they are 9–19%, which makes overreaching a real risk.

## Tie-breaks

How each tie-break rule changes the averages, at target 10:

| Tie rule | 3 players: critical | Failure | Bust | 4 players: critical | Failure | Bust |
| --- | --- | --- | --- | --- | --- | --- |
| The world takes every tie | 14% | 17% | 11% | 14% | 20% | 8% |
| The only tied card in the world card's suit | 16% | 13% | 12% | 17% | 13% | 10% |
| **Suit, then trump** *(adopted)* | **16%** | **11%** | 13% | **18%** | **11%** | 11% |
| The neediest player | 15% | 14% | 11% | 16% | 15% | 9% |
| The lowest tally | 15% | 14% | 11% | 15% | 15% | 9% |
| The highest tally | 17% | 15% | 12% | 17% | 16% | 10% |

**Suit, then trump** works as follows. A tied card in the world card's suit **and** its owner's trump beats one in the world card's suit only, which beats one that is only trump. It gives the fewest failures of any rule tested. It is decided by the cards on the table, so nobody compares tallies, and it reads well in the fiction: answering the situation beats pressing your own approach. Every rule that gives the trick to some player beats letting the world take ties.

## Dexterity's consolation

Slip returned a losing Dexterity card to hand, so losing was free. These runs compare it with every replacement tried. Only Slip keeps Stumble's loop. Under every other rule, a losing Stumble takes the new consolation and goes to discard.

**Rules that change your next play or your hand:**
- **Slip** (the original): return the card to your hand.
- **Wait** (adopted, then replaced): on your next trick, choose and reveal after everyone else.
- **Duck:** return the card only if its printed value was lower than the world card's.
- **Pull:** if your next card wins, you may refuse the world card.
- **Feint:** your next card counts as the world card's suit for winning.

**Rules that change the world row:**
- **Peek** *(adopted)*: look at the top card of the world deck; you may swap it for the next world card.
- **Reroll:** if anyone asks, discard the next world card and deal a replacement, once.
- **Reroll each:** each Dexterity loser may discard and replace the next world card.
- **Sidestep:** swap the next world card with any later card in the row.
- **Shove:** put the next world card at the end of the row.

**3 players, target 10, plus solo:**

| Dexterity's consolation | Critical | Failure | Bust | Lost to an ally, per player per check | Success or better: Dexterity player / others | Solo: critical / bust |
| --- | --- | --- | --- | --- | --- | --- |
| Slip (original) | 25% | 5% | 1% | 2.5 | 75% / 79% | — |
| Nothing at all | 15% | 13% | 13% | 2.3 | 51% / 57% | 22% / 27% |
| Wait | 16% | 11% | 14% | **1.9** | 53% / 57% | 21% / 28% |
| Duck | 21% | 8% | 4% | 2.4 | 65% / 73% | — |
| Pull | 16% | 13% | 13% | 2.3 | 53% / 57% | — |
| Feint | 16% | 8% | 17% | 2.5 | 57% / 57% | — |
| **Peek** *(adopted)* | 17% | 12% | 13% | 2.6 | 53% / 58% | **26% / 25%** |
| Reroll | 16% | 12% | 12% | 2.7 | 52% / 58% | 25% / 27% |
| Reroll each | 17% | 11% | 13% | 2.7 | 54% / 58% | 25% / 26% |
| Sidestep | 18% | 12% | 15% | 2.6 | 51% / 56% | 28% / 28% |
| Shove | 15% | 12% | 14% | 2.5 | 51% / 55% | 23% / 27% |
| Wait, +2 starting cards | 22% | 7% | 4% | 2.1 | 67% / 74% | — |
| Duck, +1 starting card | 24% | 6% | 2% | 2.5 | 70% / 79% | — |

"Lost to an ally" counts the times a player went for a world card and lost it to an ally: one who played higher, tied, or blocked with an off-suit card.

- **Slip's power was spare cards, not Dexterity.** The Dexterity player did no better than the others under Slip. Every deck holds Spades, and each one that came back was a card that could always lose. Every rule that keeps no card lands within a point or two of giving Dexterity nothing.
- **So the choice is about feel.** Wait was the only rule that cut collisions, by about a quarter, but did nothing solo. Peek works at any table size, puts the world deck in play, and is among the best solo options. A Peeking bot acts only about once in every eight losses with a Spade, because it swaps only when the top card is better.
- **Reroll and Shove churn the table.** They act one to two times a check per player, and the bots ignore allies, so a reroll can throw away a card a friend wanted.
- **Extra starting cards would restore the spare cards** and bring busts back to 2–4%. They weren't adopted: the harder checks were judged better for the game.

## Reducing collisions

These rules aim at the main source of frustration: an ally taking, tying or blocking a world card you went for. Each runs under the current rules.

- **No blocking:** off-suit cards are ignored; only on-suit cards contend.
- **Call in or out:** before choosing, everyone shows at once whether they're going for the world card. If more than one is in, anyone it wouldn't land exactly stands aside.
- **Show need:** before choosing, everyone shows at once 0 (not going for it), 1 (it would help) or 2 (it lands me exactly). Anyone below the highest showing stands aside.
- **Point reveals first:** a point player, passing clockwise each trick, plays face up first. Everyone else then chooses face down and reveals together, as usual.
- **Point wins ties:** the same rotating point player wins any tie they're part of. Otherwise suit, then trump, as usual.
- **Claim before drawing:** after the row is dealt and before anyone draws, players claim world cards in the row (talk is allowed then). Allies leave claimed cards alone.

| Rule | 3 players: critical | Failure | Bust | Lost to an ally | Checks with any collision | 4 players: critical | Failure | Bust | Lost to an ally |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Current** | 16% | 12% | 12% | 2.6 | 93% | 18% | 11% | 12% | 3.9 |
| No blocking | 21% | **5%** | **22%** | 2.1 | 93% | 24% | 3% | 23% | 3.2 |
| Call in or out | 12% | **53%** | 7% | 0.4 | 54% | 11% | 64% | 4% | 0.5 |
| Show need | 18% | 13% | 13% | 2.3 | 92% | 21% | 13% | 12% | 3.4 |
| Point reveals first | **19%** | **7%** | 14% | **1.6** | **86%** | **21%** | **7%** | 12% | **2.7** |
| Point wins ties | 17% | 10% | 13% | 2.4 | 93% | 18% | 9% | 12% | 3.8 |
| Claim before drawing | 12% | 18% | 12% | 2.0 | 88% | 12% | 18% | 11% | 3.0 |
| Claim and show need | 14% | 19% | 12% | 1.8 | 87% | 14% | 20% | 11% | 2.7 |
| Point reveals first, no blocking | 19% | 4% | 28% | 1.5 | 89% | 20% | 3% | 32% | 2.5 |

- **Point reveals first works best** on paper. It cuts losses to allies by 30–40%, adds about 3 points of critical, and cuts failure by 4–5 points, for 1–2 more points of busts. But a point player who changes every trick is one more thing to track, and it gives up the fully simultaneous reveal.
- **Point wins ties is the gentlest change,** for about 1 point of critical and 2 points less failure. It barely reduces collisions.
- **No blocking more than halves failures but nearly doubles busts.** Off-suit blocks are a hidden cause of failure: without them, the world takes far fewer tricks. They're also the only way to stop an ally busting, so removing them trades one frustration for another.
- **Showing need helps a little,** mostly to exact hits, but it is a signal, which goes against the no-coordination rule.
- **Calling in or out backfires.** When several players are in, everyone stands aside and the world takes the trick: failures quadruple. People face the same "after you" problem.
- **Claiming before drawing makes things worse.** Players claim cards before they know whether their hand can win them, and claimed cards then sit unwon.

### Runoffs

A **runoff** settles a collision by revealing cards from hand: each contender reveals one card at once, and the higher value wins. Bots that want the world card reveal their highest card; bots that don't want it reveal their lowest, which lets a player escape a win that would bust them. Revealed cards also tell allies what you hold, but the bots only use that in the "read" lines below. There, a bot stands aside if an ally has revealed a card that would take this world card and still fits that ally, unless it lands the bot exactly.

| Runoff (3 players, target 10) | Critical | Failure | Bust | Lost to an ally | Runoffs per player per check |
| --- | --- | --- | --- | --- | --- |
| Current (suit, then trump; no runoff) | 16% | 12% | 12% | 2.6 | — |
| Suit, then trump; a runoff only for ties it leaves level | 17% | 10% | 13% | 2.5 | 0.2 |
| Ties run off; card kept; equal reveals to the world | 16% | 13% | 12% | 2.7 | 0.8 |
| Ties run off; card kept; equal reveals go by suit, then trump | 17% | 11% | 13% | 2.5 | 0.8 |
| Ties run off; card spent | 14% | 18% | 12% | 2.5 | 0.7 |
| Every on-suit card that beats the world card runs off; kept; then suit and trump | 17% | 16% | 12% | 2.7 | 3.3 |
| Ties run off, kept, then suit and trump; bots read revealed cards | 17% | 14% | 13% | 2.2 | 0.7 |
| Every beater runs off, kept, then suit and trump; bots read revealed cards | 16% | 23% | 11% | 1.9 | 2.0 |

- **A runoff after suit, then trump, or a kept-card runoff that falls back to it, matches the current tie-break** within a point. It adds a moment of drama and information but doesn't reduce collisions.
- **Spending the revealed card is expensive:** 2 points of critical and 6 of failure.
- **Running off every beater is worse.** The highest card no longer wins, so a player can't make sure of a world card they need, and failures rise.
- **Reading revealed cards cuts collisions but raises failure.** Players defer to an ally who might take the card and then doesn't, the same "after you" problem as calling in or out. People will read better than these bots, but the risk is real.

**Kept as it is:** simultaneous play and suit-then-trump ties, with no point player and no runoff. Simultaneous reveals are where the interesting play is, and talk before and after a check is how a table learns to stay out of each other's way.

## Statuses

**Forced play.** These runs use 4 players at target 10:
- a worn deck carries an Injury, a Stumble and a Stress;
- a heavily worn deck carries two Injuries, a Stumble, a Stress and a Curse.

| Party | Critical | Failure | Bust | Forced status plays per player per check | Stumble's Price paid per check |
| --- | --- | --- | --- | --- | --- |
| Clean | 18% | 11% | 11% | — | — |
| Worn, statuses held freely | 18% | 11% | 11% | — | 0.1 |
| **Worn, matching status must be played** | 16% | 12% | 12% | 1.1 | 0.4 |
| Heavily worn, held freely | 19% | 11% | 10% | — | 0.1 |
| **Heavily worn, must be played** | 16% | 13% | 12% | 1.7 | 0.4 |

- **Held freely, statuses cost almost nothing during a check.** They make good passes once you're on target.
- **Forced play costs about 2 points of critical** and adds a point or two of busts. The situation finds your weakness at the worst moment.

**Stumble's own rule,** tested in the worn party:

| Stumble's rule | Critical | Failure | Bust |
| --- | --- | --- | --- |
| **Price:** discard an ordinary card when played *(adopted)* | 16% | 12% | 12% |
| Trip: the next world card counts 2 higher for beating | 17% | 13% | 11% |
| Grab: if nobody wins the trick, a played Stumble takes the world card | 16% | 12% | **16%** |
| No rule | 17% | 11% | 11% |

Without the loop, Stumble is forced out about once per Dexterity world card and then it's spent. So Price is paid only 0.4 times a check, and the four rules land within a point or two of each other. Grab is the only one with a clear effect: it adds busts.

## Survival

Each cell is the chance of death: a bust, or 7 or more short. The survivor plays alongside two allies at target 10, in a 10-trick check.

| Injuries | **3 × M** *(adopted)* | 4 × M − 2 | 4 × M | 4 × M under the old Slip |
| --- | --- | --- | --- | --- |
| 2 | **14%** (target 6) | 14% (6) | 20% (8) | 5% (8) |
| 3 | **20%** (9) | 21% (10) | 26% (12) | 13% (12) |
| 4 | **28%** (12) | 37% (14) | 49% (16) | 34% (16) |
| 5 | **44%** (15) | 61% (18) | 71% (20) | 59% (20) |
| 6 | **63%** (18) | 82% (22) | 88% (24) | 81% (24) |

- **3 × M climbs smoothly,** and it is the only rule tested whose targets stay inside 6–20 through six Injuries.
- **At two Injuries the target is 6,** where landing 7 short is impossible: death comes only from overreaching.
- **From four Injuries on, almost every death is a failure** (7 or more short), not a bust.

## Starter decks

The adopted starter has two of each value A–10 in 20 cards, spread so each suit has a range:

- **Primary:** A, 2, 4, 5, 7, 8, 10. Every value except 3, 6 and 9.
- **Secondary:** A, 3, 6, 9, 10.
- **The other two suits:** 2, 3, 6, 9 and 4, 5, 7, 8. Each player chooses which suit gets which.

It replaced a 21-card starter with 2, 4, 6 and 8 in every suit, A, 5 and 9 added to the primary, and 3 and 7 to the secondary. The old starter had no 10s, few odd values and a mean value of 5.0.

| Recipe | Primary | Secondary | Other two suits | Cards | Mean value |
| --- | --- | --- | --- | --- | --- |
| Old 2-4-6-8 | A, 2, 4, 5, 6, 8, 9 | 2, 3, 4, 6, 7, 8 | 2, 4, 6, 8 each | 21 | 5.0 |
| A-4-7-10 | A, 2, 4, 5, 7, 8, 10 | A, 3, 4, 6, 7, 10 | A, 4, 7, 10 each | 21 | 5.3 |
| 2-5-8-10 | A, 2, 4, 5, 7, 8, 10 | 2, 3, 5, 6, 8, 10 | 2, 5, 8, 10 each | 21 | 5.8 |
| 3-5-7-9 | A, 2, 3, 5, 7, 9, 10 | 3, 4, 5, 7, 8, 9 | 3, 5, 7, 9 each | 21 | 5.8 |
| 2-5-8 deep | A, 2, 4, 5, 7, 8, 9, 10 | 2, 3, 5, 6, 8, 9, 10 | 2, 5, 8 each | 21 | 5.7 |
| **Pairs, spread** *(adopted)* | A, 2, 4, 5, 7, 8, 10 | A, 3, 6, 9, 10 | 2, 3, 6, 9 and 4, 5, 7, 8 | 20 | 5.5 |
| Pairs, odds and evens | A, 3, 5, 7, 9, 10 | 2, 4, 6, 8, 10 | A, 3, 5, 7, 9 and 2, 4, 6, 8 | 20 | 5.5 |
| Pairs, trump run | A–10 | 3, 6, 9, 10 | A, 4, 7 and 2, 5, 8 | 20 | 5.5 |
| 26: two runs | A–10 | A–10 | A, 4, 7 and 2, 5, 8 | 26 | 5.3 |
| 26: A-4-7-10, primary run | A–10 | A, 2, 4, 5, 7, 8, 9, 10 | A, 4, 7, 10 each | 26 | 5.5 |

| Recipe | 3 players: critical | Failure | Bust | 4 players: critical | Failure | Bust | 2 players: critical | Failure | Bust | Ties lost per player per check (3 players) | Solo: bust |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Old 2-4-6-8 | 15% | 16% | 11% | 16% | 15% | 10% | 13% | 20% | 9% | 0.84 | 23% |
| A-4-7-10 | 16% | 12% | 12% | 17% | 12% | 11% | 15% | 15% | 11% | 0.86 | 24% |
| 2-5-8-10 | 16% | 12% | 12% | 17% | 14% | 10% | 15% | 15% | 11% | 0.87 | 25% |
| 3-5-7-9 | 16% | 13% | 13% | 17% | 12% | 12% | 15% | 16% | 12% | 0.83 | 27% |
| 2-5-8 deep | 17% | 11% | 15% | 18% | 11% | 14% | 16% | 13% | 14% | 0.73 | 30% |
| **Pairs, spread** | **17%** | **11%** | 13% | **18%** | **11%** | 12% | 15% | 15% | 11% | **0.64** | 25% |
| Pairs, odds and evens | 16% | 11% | 13% | 18% | 10% | 12% | 15% | 14% | 12% | 0.67 | 24% |
| Pairs, trump run | 16% | 10% | **19%** | 16% | 11% | **19%** | 17% | 11% | 17% | 0.73 | **40%** |
| 26: two runs | 17% | 12% | 14% | 18% | 11% | 14% | 15% | 15% | 12% | 0.60 | 29% |
| 26: A-4-7-10, primary run | 16% | 11% | 14% | 17% | 12% | 13% | 16% | 13% | 13% | 0.66 | 30% |

- **Every wider spread helps.** An Ace and a 10 in more suits give each player a sure loser and a likely winner, so failures fall 3–5 points and critical rises 1–2.
- **Two of each value does as well as the best 21-card spreads and ties about a quarter less often,** because fewer cards share a value. Collisions overall barely move (2.6 lost to an ally per check either way).
- **Pairs, spread is the best balance.** It keeps seven primary cards, gives the most exact hits and among the fewest failures, and helps hard goals most: the target-16 player in the mixed-stakes scene fails 40% of the time instead of 51%.
- **Piling a full run into the trump suit busts a fifth of all results,** and 40% of solo checks: too many cards win when you don't want them to.
- **The 26-card decks add 1–2 points of busts** for nothing in exact hits. Inside a check, only the mix of values matters; deck size changes how often you reshuffle and how fast statuses dilute.
- **No recipe cuts collisions much.** Every player builds from the same recipe, so allies hold similar values. Strength still lands the most exact hits under every recipe.

## Choosing a target

From [`simulate_targets.mjs`](../../scripts/simulate_targets.mjs): random 21-card decks, with trump set to each deck's biggest suit. Ranges cover 2–5 players; larger tables hit more often and bust less. Starter decks land close to these figures: at target 10 with 3 players, 17% exact and 13% bust, against 17% and 12% here.

**Standard checks** (3 tricks per player, +1):

| Target | Difficulty | Exact hit | 7 or more short | Bust | Under the old Slip: exact / bust |
| --- | --- | --- | --- | --- | --- |
| 1–5 | *(too low)* | 20–29% | 0% | 15–32% | 25–44% / 1–12% |
| 6–8 | Easy | 18–27% | 0–10% | 13–18% | 22–41% / 1–9% |
| 9–11 | Moderate | 12–23% | 10–20% | 9–14% | 13–36% / 1–7% |
| 12–14 | Hard | 8–16% | 22–39% | 7–10% | 9–24% / 1–6% |
| 15–17 | Very hard | 4–11% | 39–59% | 4–6% | 5–17% / 0–4% |
| 18–20 | Extreme | 2–7% | 55–74% | 2–4% | 3–11% / 0–2% |

Below 6, busts climb (32% at target 1 with 2 players), while success or better doesn't get any likelier. That is why RULES.md starts targets at 6.

**Quick checks** (2 tricks per player, +1) and **solo checks** (6 tricks):

| Target | Quick: exact | Quick: 7+ short | Quick: bust | Solo: exact | Solo: 7+ short | Solo: bust |
| --- | --- | --- | --- | --- | --- | --- |
| 6–8 | 12–18% | 0–23% | 9–13% | 21–24% | 0–3% | 25–29% |
| 9–10 | 8–14% | 25–32% | 7–9% | 17–20% | 5–8% | 21–23% |
| 11–12 | 5–9% | 34–47% | 5–6% | 13–15% | 11–15% | 16–18% |

## Suggested next steps

- **Adopted** (RULES.md):
  - the suit-then-trump tie-break, with simultaneous play kept;
  - forced statuses, with Stumble keeping Price;
  - Peek, with no extra cards;
  - targets from 6;
  - survival at 3 × M;
  - fiction-based critical and bust results;
  - the 20-card starter with two of each value.
- **Playtest with real people.** Check whether:
  - talk before and after a check is enough for allies to stay out of each other's way;
  - Peek swaps that take a card an ally wanted feel like collisions of their own;
  - working out the exact total at the end of a check drags;
  - busts at 13–18% feel right on easy targets.
- **Watch Strength's edge.** Strength players land 3–8 points more exact hits than the others under every recipe. If playtests agree, Brace may need a limit.
- **Solo checks** bust about a quarter of the time at targets 6–8. They may need larger targets, or acceptance as harsh.
- **Decide whether busts should matter more.** If so, try the hidden-value variant for tense scenes.
