# Tally in simulated play

Thirteen table situations and five experiments, run under the current [RULES.md](../../RULES.md):
- Wait is Dexterity's consolation;
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
- A Waiting bot sees the table first. It takes the world card if one of its cards wins outright and fits its target. Otherwise it plays a card that neither ties nor blocks an ally who is winning.
- Cooperative bots in situation 2 also skip a world card that would land an ally exactly.

No bot reads another player's hand or plans more than one trick ahead. So **compare situations with each other rather than treating any number as table odds.** People should land exactly more often.

Earlier runs under the old Slip, and the experiments that led to the current rules, are in this file's history (commit `a6755b4` and before).

## Results

Each row is one player:
- **Critical** is exactly on target.
- **Success** is 1–3 short.
- **Partial** is 4–6 short.
- **Failure** is 7 or more short.
- **Bust** is over the target.

Unless stated, players use fresh 21-card starter decks whose primary suit is their trump.

### 1. Default scene: 3 players, standard check (10 tricks), target 10

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana (Strength) | 17% | 41% | 20% | 12% | 10% |
| Ben (Dexterity) | 12% | 35% | 24% | 19% | 9% |
| Cara (Intelligence) | 12% | 33% | 22% | 16% | 17% |

The world takes 51% of tricks. About half of all results are success or better, and roughly 1 in 8 busts.

### 2. The same scene, with allies yielding

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana | 18% | 38% | 21% | 14% | 10% |
| Ben | 14% | 33% | 24% | 21% | 9% |
| Cara | 13% | 31% | 22% | 17% | 18% |

Yielding adds only 1–2 points of critical. Under the old Slip it added 6–8. Wait already lets a player step aside once they've seen the table, so a blind yield adds little.

### 3. Mixed stakes: per-player targets in one check

| Player | Target | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- | --- |
| Ana: hold the door | 6 | 23% | 41% | 20% | 0% | 16% |
| Ben: lift the keys | 10 | 12% | 36% | 22% | 20% | 9% |
| Cara: talk down the sheriff | 16 | 5% | 19% | 20% | 51% | 6% |

The target sets the difficulty as intended. An easy target can't fail outright, but it busts most.

### 4–5. A party of four, worn down or clean (13 tricks, target 10)

| Player | Worn: critical | Worn: failure | Worn: bust | Clean: critical | Clean: failure | Clean: bust |
| --- | --- | --- | --- | --- | --- | --- |
| P1 (Strength) | 18% | 11% | 10% | 20% | 8% | 9% |
| P2 (Dexterity) | 12% | 20% | 8% | 14% | 18% | 7% |
| P3 (Intelligence) | 11% | 18% | 16% | 12% | 16% | 16% |
| P4 (Weird) | 15% | 15% | 10% | 15% | 15% | 10% |

In the worn party, each deck carries an Injury, a Stumble and a Stress. That costs 1–2 points of critical. Each player is forced to play a status about once a check, and pays Stumble's Price 0.4 times a check.

### 6–7. Survival at target 3 × Injuries

| Survivor | Target | Critical | Success | Partial | Failure | Bust | Death |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Two Injuries | 6 | 22% | 41% | 23% | 0% | 13% | **13%** |
| Three Injuries | 9 | 16% | 40% | 21% | 15% | 9% | **24%** |

The survivor's two allies play their own target-10 goals. At target 6, falling 7 short is impossible, so only a bust kills. See *Survival* below for two to six Injuries.

### 8–10. Small tables, quick checks, solo

| Situation | Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- | --- |
| 8. Two players, 7 tricks, target 10 | Ana (Strength) | 13% | 36% | 24% | 18% | 9% |
| | Ben (Dexterity) | 10% | 32% | 24% | 24% | 9% |
| 9. Quick check, 3 players, 7 tricks, target 6 | Ana | 16% | 36% | 38% | 0% | 10% |
| | Ben | 14% | 33% | 44% | 0% | 9% |
| | Cara | 13% | 33% | 37% | 0% | 17% |
| 10. Solo, 6 tricks, target 6 | Ana | 20% | 38% | 15% | 0% | **26%** |

- **Two players** is the hardest standard table: the fewest exact hits and the most failures.
- **Quick checks are partial-heavy.** About 4 in 10 results land 4–6 short, and none can fail at target 6.
- **Solo checks bust a quarter of the time.** Nobody else is at the table, so Wait does nothing. The world takes 72% of tricks, and late in the check every card left can be a forced win.

### 11. Opposed goals: two players, 7 tricks, both at target 10

Ana (Strength) wins **51%**, Ben (Dexterity) **42%**, and **7%** are a stalemate. Both players have the same target. The gap is Strength's edge (see Findings).

### 12. Late campaign: 3 players with drifted decks

These decks are 21 random cards from A–10 instead of the starter. Critical is 12–17%, failure 13–16% and bust 8–19%, close to situation 1. Starter-deck results should hold as decks drift.

### 13. Hidden world values

In this variant, each world card's suit shows but its value stays hidden until everyone reveals.

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana | 9% | 36% | 26% | 15% | 14% |
| Ben | 7% | 31% | 27% | 21% | 13% |
| Cara | 8% | 28% | 24% | 20% | 20% |

Hiding the values halves exact hits, and busts rise to 13–20%. It works as a dial for tense scenes, not a default.

## Findings

1. **Checks are hard but readable.** At the default target in a three-player check:
   - about half of results are success or better;
   - 12–17% are exact;
   - 9–17% bust.

   Larger tables do better: at 5 players, 21% are exact and 11% bust.
2. **Strength looks strongest.** Strength players land exactly 17–21% of the time against 10–15% for the others, and win the opposed check 51% to 42%. Brace's reach is worth more than the other consolations once Slip's spare cards are gone.
3. **Dexterity players fall short most:** 18–24% failure. Wait spends the card and only pays off on the next trick: about 0.6 waited wins a check for a Dexterity player.
4. **Intelligence players bust most (16–17%).** Part of this is the bot: Recalculate drops its lowest card, so the hand fills with high cards that win when it doesn't want to. People may handle that better.
5. **Accidents are constant.** Hands are hidden and nobody talks, so 88–97% of checks see at least one player lose a world card they went for. Per player per check:
   - Ana loses about 1 world card to an ally who played higher;
   - she loses 0.5 to a tie;
   - she loses 0.2 to an off-suit block;
   - and she has 0.1–0.2 forced wins she didn't want.

   Forced wins are the main source of busts.
6. **The tie-break matters.** In a three-player check, players tie for the top card about 1.4 times a check, and 0.9 of those ties are all on-suit. Suit-then-trump settles about two-thirds of the on-suit ones (68% at 3 players, 72% at 4).
7. **Statuses cost something mainly because they must be played.** Held statuses barely matter. Forced play costs about 2 points of critical (see *Statuses*).
8. **Busts are part of the game now.** Under the old Slip, every returned Spade was a spare card that couldn't win, so busts were 0–7% at the default target. Under Wait they are 9–17%, which makes overreaching a real risk.

## Tie-breaks

How each tie-break rule changes the averages. Each line is 20,000 checks at target 10.

| Tie rule | 3 players: critical | Failure | Bust | 4 players: critical | Failure | Bust |
| --- | --- | --- | --- | --- | --- | --- |
| The world takes every tie | 13% | 21% | 10% | 13% | 22% | 9% |
| The only tied card in the world card's suit | 13% | 17% | 11% | 14% | 17% | 10% |
| **Suit, then trump** *(adopted)* | **14%** | **16%** | 12% | **16%** | **15%** | 10% |
| The neediest player | 13% | 18% | 11% | 14% | 19% | 9% |
| The lowest tally | 13% | 18% | 11% | 14% | 19% | 9% |
| The highest tally | 14% | 19% | 11% | 15% | 19% | 10% |

**Suit, then trump** works as follows. A tied card in the world card's suit **and** its owner's trump beats one in the world card's suit only, which beats one that is only trump. It gives the fewest failures of any rule tested. It is decided by the cards on the table, so nobody compares tallies, and it reads well in the fiction: answering the situation beats pressing your own approach. Every rule that gives the trick to some player beats letting the world take ties.

## Replacing Slip

Slip returned a losing Dexterity card to hand, so losing was free. These runs compare Slip with its replacements. Only Slip keeps Stumble's loop. Under every other rule, a losing Stumble takes the new consolation and goes to discard.

**The candidates**, each taken on a trick loss with a Dexterity card:
- **Slip** (the old rule): return the card to your hand.
- **Wait** *(adopted)*: on your next trick, choose and reveal after everyone else.
- **Duck:** return the card only if its printed value was lower than the world card's.
- **Pull:** if your next card wins, you may refuse the world card.
- **Feint:** your next card counts as the world card's suit for winning.
- **+1 / +2:** draw one or two more cards than the check has tricks.

**3 players, target 10:**

| Dexterity's consolation | Critical | Failure | Bust | Ally collisions per player per check | Success or better: Dexterity player / others |
| --- | --- | --- | --- | --- | --- |
| Slip (old) | 22% | 9% | 1% | 1.1 | 69% / 70% |
| Nothing at all | 13% | 17% | 12% | 1.1 | 46% / 51% |
| **Wait** *(adopted)* | 14% | 15% | 12% | **0.8** | 48% / 52% |
| Duck | 19% | 12% | 2% | 1.1 | 58% / 67% |
| Pull | 14% | 17% | 11% | 1.1 | 46% / 52% |
| Feint | 15% | 14% | 15% | 1.3 | 51% / 52% |
| Nothing, +2 cards | 18% | 12% | 3% | 1.3 | 58% / 66% |
| Wait, +1 card | 17% | 12% | 5% | 0.8 | 55% / 62% |
| Wait, +2 cards | 19% | 11% | 3% | 0.8 | 61% / 66% |
| Duck, +1 card | 21% | 10% | 1% | 1.2 | 63% / 71% |

"Ally collisions" counts the times a player went for a world card and lost it to an ally's tie or block.

- **Slip's power was spare cards, not Dexterity.** The Dexterity player did no better than the others under Slip. Every deck holds Spades, and each one that came back was a card that could always lose. Every rule that keeps no card scores about the same as giving Dexterity nothing.
- **Wait is the only rule that cuts collisions,** by about 30%. The bot uses it only to take a world card cleanly or stay out of the way, so people will likely get more from it.
- **Extra starting cards would restore the spare cards** and bring busts back to 3%. They weren't adopted: the harder checks under plain Wait were judged better for the game.
- **Duck** is the closest drop-in for Slip, but it hits Dexterity players hardest.
- **Pull almost never triggers** when it would help. **Feint raises busts,** because more of your cards become accidental winners.

## Statuses

**Forced play.** These runs use 4 players at target 10:
- a worn deck carries an Injury, a Stumble and a Stress;
- a heavily worn deck carries two Injuries, a Stumble, a Stress and a Curse.

| Party | Critical | Failure | Bust | Forced status plays per player per check | Stumble's Price paid per check |
| --- | --- | --- | --- | --- | --- |
| Clean | 16% | 15% | 10% | — | — |
| Worn, statuses held freely | 16% | 15% | 9% | — | 0.1 |
| **Worn, matching status must be played** | 14% | 17% | 11% | 1.0 | 0.4 |
| Heavily worn, held freely | 16% | 15% | 9% | — | 0.1 |
| **Heavily worn, must be played** | 14% | 17% | 11% | 1.6 | 0.4 |

- **Held freely, statuses cost almost nothing during a check.** They make good passes once you're on target.
- **Forced play costs about 2 points of critical** and adds a point or two of failure and busts. The situation finds your weakness at the worst moment.

**Stumble's own rule,** tested in the worn party:

| Stumble's rule | Critical | Failure | Bust |
| --- | --- | --- | --- |
| **Price:** discard an ordinary card when played *(adopted)* | 14% | 16% | 11% |
| Trip: the next world card counts 2 higher for beating | 14% | 18% | 9% |
| Grab: if nobody wins the trick, a played Stumble takes the world card | 14% | 16% | **14%** |
| No rule | 15% | 15% | 10% |

Without the loop, Stumble is forced out about once per Dexterity world card and then it's spent. So Price is paid only 0.4 times a check, and the four rules land within a point or two of each other. Grab is the only one with a clear effect: it adds busts.

## Survival

Each cell is the chance of death: a bust, or 7 or more short. The survivor plays alongside two allies at target 10, in a 10-trick check.

| Injuries | **3 × M** *(adopted)* | 4 × M − 2 | 4 × M | 4 × M under the old Slip |
| --- | --- | --- | --- | --- |
| 2 | **14%** (target 6) | 14% (6) | 22% (8) | 8% (8) |
| 3 | **23%** (9) | 24% (10) | 32% (12) | 21% (12) |
| 4 | **34%** (12) | 46% (14) | 60% (16) | 48% (16) |
| 5 | **54%** (15) | 72% (18) | 81% (20) | 75% (20) |
| 6 | **74%** (18) | 89% (22) | 94% (24) | 91% (24) |

- **3 × M climbs smoothly,** and it is the only rule tested whose targets stay inside 6–20 through six Injuries.
- **At two Injuries the target is 6,** where landing 7 short is impossible: death comes only from overreaching.
- **From four Injuries on, almost every death is a failure** (7 or more short), not a bust.

## Choosing a target

From [`simulate_targets.mjs`](../../scripts/simulate_targets.mjs): random 21-card decks, with trump set to each deck's biggest suit. Ranges cover 2–5 players; larger tables hit more often and bust less.

**Standard checks** (3 tricks per player, +1):

| Target | Difficulty | Exact hit | 7 or more short | Bust | Under the old Slip: exact / bust |
| --- | --- | --- | --- | --- | --- |
| 1–5 | *(too low)* | 17–29% | 0% | 15–34% | 24–44% / 1–12% |
| 6–8 | Easy | 17–26% | 0–11% | 13–19% | 22–41% / 1–8% |
| 9–11 | Moderate | 10–23% | 10–21% | 10–16% | 13–36% / 1–7% |
| 12–14 | Hard | 7–15% | 20–40% | 8–11% | 8–24% / 1–5% |
| 15–17 | Very hard | 4–12% | 36–59% | 5–7% | 5–17% / 1–4% |
| 18–20 | Extreme | 2–8% | 51–75% | 2–5% | 2–11% / 0–2% |

Below 6, busts climb (34% at target 1 with 2 players), while success or better doesn't get any likelier. That is why RULES.md starts targets at 6.

**Quick checks** (2 tricks per player, +1) and **solo checks** (6 tricks), under Wait:

| Target | Quick: exact | Quick: 7+ short | Quick: bust | Solo: exact | Solo: 7+ short | Solo: bust |
| --- | --- | --- | --- | --- | --- | --- |
| 6–8 | 11–17% | 0–25% | 9–14% | 18–21% | 0–4% | 28–32% |
| 9–10 | 8–15% | 23–33% | 8–10% | 15–17% | 6–9% | 22–25% |
| 11–12 | 4–8% | 32–47% | 5–7% | 12–13% | 12–17% | 18–20% |

## Suggested next steps

- **Adopted** (RULES.md):
  - the suit-then-trump tie-break;
  - forced statuses, with Stumble keeping Price;
  - Wait, with no extra cards;
  - targets from 6;
  - survival at 3 × M;
  - fiction-based critical and bust results.
- **Playtest with real people.** Check whether:
  - collisions feel fair;
  - Wait is fun to use;
  - working out the exact total at the end of a check drags;
  - busts at 13–19% feel right on easy targets.
- **Watch Strength's edge.** Strength players land 5–8 points more exact hits than the others. If playtests agree, Brace may need a limit.
- **Solo checks** bust 26–32% at targets 6–8. They need their own Dexterity rule, larger targets, or acceptance as harsh.
- **Decide whether busts should matter more.** If so, try the hidden-value variant for tense scenes.
