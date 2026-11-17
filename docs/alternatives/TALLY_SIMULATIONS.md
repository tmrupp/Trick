# Tally in simulated play

Twelve table situations, plus survival variants, run through the current [RULES.md](../../RULES.md): 20,000 checks each. The simulator is [scripts/simulate_tally.mjs](../../scripts/simulate_tally.mjs):

```bash
node scripts/simulate_tally.mjs 20000
```

**The bots are simple.** Each takes a world card when it can beat it without busting, playing its lowest winning card. Otherwise it passes with the card it values least: Dexterity first (Slip returns it), then statuses, then Weird, Strength, Intelligence, and Stumble last. Cooperative bots in situation 2 also skip a world card that would land an ally exactly. No bot reads another player's hand or plans more than one trick ahead, so **compare situations with each other rather than treating any number as table odds.** People should land exactly more often.

Unless stated, players use fresh 21-card starter decks whose primary suit is their trump.

## Results

Each row is one player. **Critical** is exactly on target; **success** is 1–3 short; **partial** is 4–6 short; **failure** is 7+ short; **bust** is over.

### 1. Default scene: 3 players, standard check (10 tricks), target 10

| Player | Critical | Success | Partial | Failure | Bust | Tricks won |
| --- | --- | --- | --- | --- | --- | --- |
| Ana (Strength) | 22% | 45% | 20% | 13% | 0% | 1.6 |
| Ben (Dexterity) | 14% | 44% | 25% | 17% | 1% | 1.4 |
| Cara (Intelligence) | 14% | 38% | 25% | 22% | 2% | 1.5 |

The world takes 55% of tricks. About two-thirds of results are a success or better, one in six is a failure, and busts are rare.

### 2. The same scene, with allies yielding

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana (Strength) | **30%** | 38% | 18% | 14% | 0% |
| Ben (Dexterity) | **20%** | 37% | 23% | 19% | 1% |
| Cara (Intelligence) | **20%** | 31% | 22% | 24% | 2% |

**Losing to help works.** Passing on a world card that lands an ally exactly raises every player's critical rate by 6–8 points, at a cost of 1–2 points more failure each.

### 3. Mixed stakes: per-player targets in one check

| Player | Target | Critical | Success | Partial | Failure |
| --- | --- | --- | --- | --- | --- |
| Ana: hold the door | 6 | 27% | 48% | 25% | 0% |
| Ben: lift the keys | 10 | 14% | 45% | 23% | 18% |
| Cara: talk down the sheriff | 16 | 5% | 19% | 20% | **55%** |

Separate targets work without any extra rule. The easy task can't fail. The very hard one usually does, even though Cara wins slightly more tricks than anyone (1.9).

### 4–5. A party of four, worn down or clean (13 tricks, target 10)

Each worn deck carries an Injury, a Stumble and a Stress.

| Player | Critical, worn | Critical, clean | Failure, worn | Failure, clean |
| --- | --- | --- | --- | --- |
| Strength | 25% | 27% | 12% | 8% |
| Dexterity | 15% | 14% | 15% | 15% |
| Intelligence | 15% | 15% | 23% | 21% |
| Weird | 16% | 16% | 26% | 26% |

**Statuses barely matter during a check.** A 0-value card is a ready-made pass, and the bots paid Stumble's Price only about once in 15 checks. Statuses still cost something between checks, through survival scans, Stress copying itself and the Curse compulsion, but at the table they are nearly free.

### 6–7. Survival under the original rule (target 2 × Injuries)

| Survivor | Target | Critical | Success | Partial | Death (failure or bust) |
| --- | --- | --- | --- | --- | --- |
| 2 Injuries | 4 | 29% | 46% | 25% | **0–1%** |
| 3 Injuries | 6 | 26% | 48% | 26% | **0–1%** |

**Survival has no teeth.** At targets of 4 or 6 you cannot fall 7 short, so only a bust kills, and the bots almost never bust.

### 8–10. Small tables, quick checks, solo

| Situation | Tricks, target | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- | --- |
| 2 players, standard | 7, 10 | 13–16% | 39–41% | 25–26% | 17–20% | 1–2% |
| 3 players, quick | 7, 5 | 18–20% | 33–40% | 40–47% | 0% | 1–6% |
| Solo | 6, 6 | 33% | 51% | 12% | 0% | 4% |

Quick checks never fail, but almost half their results are partial: few tricks each means landing far short is common. Solo checks are the kindest, because nobody competes for the world cards.

### 11. Opposed goals: two players, 7 tricks, both at target 10

Ana's goal (keep the gate shut) wins 48%, Ben's (get it open) 41%, and 10% are stalemates. The split is close to even, with a small edge for the Strength player (see *Approach balance* below).

### 12. Late campaign: 3 players with drifted decks

Decks of 21 random cards from A–10: critical 17–23%, failure 11–14%, bust 1–3%. These are **slightly better than starter decks**, because the 10s and odd values help both winning and landing exactly. Campaign drift won't break the targets.

### 13. Hidden world values

As situation 1, but each world card's value stays hidden until everyone reveals; the bots guess 5.5.

| Player | Critical | Success | Partial | Failure | Bust |
| --- | --- | --- | --- | --- | --- |
| Ana (Strength) | 8% | 37% | 33% | 17% | **4%** |
| Ben (Dexterity) | 6% | 36% | 36% | 15% | **7%** |
| Cara (Intelligence) | 6% | 31% | 34% | 23% | **6%** |

Hiding the value turns busting into a real risk, at the cost of most critical successes.

## Findings

1. **The core works.** At the default target, about two-thirds of results are a success or better, one in five is a partial, one in six is a failure, and roughly one in six lands exactly. That holds from 2 to 4 players and as decks drift.
2. **Cooperation pays.** Yielding a world card to an ally who needs exactly that value is the strongest play pattern the simulation found: 6–8 points more critical successes for everyone.
3. **Busting almost never happens.** The world card is visible before anyone plays, so a careful player only busts when every card in hand would win. Bust, the critical failure, is about 1% of results. If it should be a real threat, the hidden-value variant (situation 13) brings it to 4–7%.
4. **Survival is toothless at target 2 × Injuries.** Deaths are 0–1%. Raising the target makes failure possible, and it escalates:

   Death rates (bust or 7+ short) for each candidate rule, by Injuries counted (M):

   | Injuries | 2 × M | 2 × M + 4 | 3 × M | 4 × M |
   | --- | --- | --- | --- | --- |
   | 2 | 0% (target 4) | 13% (8) | 0% (6) | 13% (8) |
   | 3 | 0% (6) | 18% (10) | 16% (9) | 28% (12) |
   | 4 | 16% (8) | 30% (12) | 30% (12) | **57%** (16) |

   - **2 × M + 4** is dangerous from the first scan and climbs gently.
   - **3 × M** is safe at two Injuries, then matches 2 × M + 4. It gives one free warning before the danger starts.
   - **4 × M** starts like 2 × M + 4, but at four Injuries death is more likely than not. **This is the rule RULES.md now uses.**
5. **Statuses cost almost nothing during a check.** The deck-clogging pressure has moved entirely between checks. If statuses should bite at the table, give the in-check penalty to more than Stumble. One option: a status played while you are below your target gives no consolation.
6. **Approach balance: Strength looks strongest.** Strength-trump players land exactly 22–30% of the time, against 14–20% for the others, in every situation. Brace is the only consolation that directly helps you win. Watch this in playtests before changing it; part of it may be how the bots pass.
7. **Quick checks are partial-heavy.** With about 0.8 wins each, 40–47% of results land 4–6 short. If that feels mushy, use target 4 for quick checks or give them more tricks.
8. **Very hard targets fail more than half the time** (target 16: 55% failure), which matches their label. Above 15, the target says "this probably goes wrong", and the table should agree before choosing it.

9. **Collisions are constant; accidental wins are rare.** With hidden hands and no talk, players go for the same world card all the time. In the default scene, each player per check is, on average:
   - **outbid by an ally** 1.2–1.9 times, going for a card someone else then takes;
   - **tied away** 1.2–1.5 times, matching an ally's value so the world takes it;
   - **blocked** 0.3–0.4 times, when a passing ally's high off-suit card stops their win.

   Nearly every check (97%) has at least one. **Taking a trick you didn't want is rare** (0.01–0.08 per check). It happens only when every card in hand would win, and then it usually busts you. With hidden world values it rises to 0.12 per check.

   Ties are common because the starter decks repeat 2, 4, 6, 8 in every suit. Two tie-breaks were tested, averaged across players:

   | Tie between players goes to… | Critical, 3 / 4 players | Failure, 3 / 4 players | Failure for the target-16 player (mixed stakes) |
   | --- | --- | --- | --- |
   | The world (current rule) | 17% / 19% | 17% / 18% | 54% |
   | The lowest tally | 18% / 20% | 11% / 10% | 49% |
   | The highest tally | **23% / 27%** | 12% / 11% | 41% |
   | Whoever is furthest from their target | 18% / 20% | 11% / 10% | **26%** |
   | **The only tied card in the world card's suit** | 20% / 23% | 12% / 10% | 44% |
   | The world card's suit, then the lowest tally | 21% / 24% | **9% / 6%** | 41% |

   - **Every tie-break cuts failure by about a third.** What they differ on is who they help.
   - **Highest tally** produces the most exact hits, because players near their target close out. It's a momentum rule: whoever is ahead stays ahead.
   - **Lowest tally** is a catch-up rule. With different targets it helps the wrong player, since easy-target players naturally have low tallies.
   - **Furthest from target** is the only one that rescues a very hard goal, because it reads the target, not just the tally.
   - **The suit rule** sits in the middle and is the only one decided purely by the cards on the table. Adding *lowest tally* as a second step, for when the suit rule can't separate the tied cards, gives the lowest failure of all with equal targets.

   **How often the suit rule can decide.** Ties between players happen 0.7 times per check with 2 players, 1.9 with 3 and 3.2 with 4: about one trick in five. Of those ties:

   | Tie type | Share of ties | Suit rule |
   | --- | --- | --- |
   | Exactly one tied card in the world card's suit | 34–40% | That card wins |
   | Both or all in the world card's suit | 29–46% | World takes it |
   | Neither in the world card's suit (both on through trump) | 9–14% | World takes it |
   | An off-suit card in the tie (a block) | 12–17% | World takes it |

   "Both match" is the most common case. Players often beat the world card with its own suit, and every starter deck holds the same 2, 4, 6 and 8 of each suit.

   **A card-only fallback: suit, then trump.** Rank the tied cards by what they match. A card in the world card's suit **and** its owner's trump beats one in the world card's suit only, which beats one that is only trump. This settles 56–65% of ties instead of 34–40%. It gives the best results of every rule tested (3 / 4 players: critical 22% / 27%, failure 9% / 6%) without anyone comparing tallies. It is decided by the cards on the table, with no tally comparison, and it reads well in the fiction: answering the situation beats pressing your own approach. If both tied cards, or neither, match the world card's suit, the world still takes it.

## Slip and Stumble experiments

These runs use the adopted suit-then-trump tie-break: 3 players, target 10, 20,000 checks each.

| Dexterity's consolation | Critical | Failure | Bust | Critical, Strength / Dexterity / Intelligence |
| --- | --- | --- | --- | --- |
| **Slip: return the card to hand (current)** | 22% | 9% | 1% | 25% / 20% / 20% |
| Return, and the next world card counts 1 lower for beating | **24%** | **6%** | 2% | 27% / 22% / 23% |
| Return, but not your own trump suit | 16% | 15% | 5% | 21% / 12% / 15% |
| Return, once per check | 16% | 16% | 5% | 21% / 14% / 13% |
| Next world card −1 for beating, for everyone (stacking) | 14% | 15% | **13%** | 18% / 13% / 12% |
| Next world card −2, for everyone (no stacking) | 15% | 14% | **14%** | 19% / 14% / 12% |
| Nothing at all | 13% | 19% | 11% | 17% / 11% / 10% |

- **Slip's return does the heavy lifting.** It gives every player a card that can always lose. Once you're on target, you need cards that can't win, because winning isn't optional. Without the return, players run out of them, and 0.1–0.2 forced wins per player per check turn into busts.
- **The world penalty barely helps.** −1 or −2, stacking or not, scores within a point or two of giving Dexterity nothing at all. Most failures come from landing short or long, not from failing to beat the world card. A lower world card also makes more of your cards accidental winners.
- **Return plus −1 is the only change that makes checks easier,** if that's the goal.
- **Limiting the return** (not your trump, or once per check) loses about 6 points of critical, and hits Dexterity players hardest.

**Stumble** was tested with each Slip in a 4-player party where every deck carries an Injury, a Stumble and a Stress:

| Stumble's rule | With Slip returning | With a −1 world Slip |
| --- | --- | --- |
| Price: discard an ordinary card when played | no effect | no effect |
| Trip: next world card +2 for beating, instead of its consolation | no effect | no effect |
| **Grab: if nobody wins the trick, a played Stumble takes the world card** | no effect | **busts 11% → 15%** |
| No rule | — | — |

Stumble matters only when safe passes are scarce. With the current Slip, players almost never need to play it. Without the return, *Grab* is the only rule that bites, because it makes Stumble unsafe as a pass: you stumble into the world card at the worst moment.

### Must play a matching status

**Variant rule:** if you hold a status in the world card's suit, you must play it that trick. A Strength world card calls out your Injury, a Dexterity one your Stumble, and so on. These runs use 4 players, target 10, the current Slip and the suit-then-trump tie-break:

| Party | Critical | Failure | Forced status plays per player per check | Stumble's Price paid per check |
| --- | --- | --- | --- | --- |
| Clean | 27% | 6% | — | — |
| Worn (Injury, Stumble, Stress) | 25% | 8% | — | 0.04 |
| Worn, must play matching status | 22% | 9% | 1.9 | **1.0** |
| Heavily worn (2 Injuries, Stumble, Stress, Curse) | 24% | 10% | — | 0.04 |
| Heavily worn, must play matching status | 20% | 12% | 2.8 | **1.1** |

- **Statuses start to cost something during a check.** Without the rule, three statuses cost 2 points of critical. With it, they cost 5, and a heavily worn deck costs 7.
- **It gives Stumble teeth without changing Stumble.** A losing Stumble still slips back to your hand, but every Dexterity world card forces it out again. So Price goes from almost never paid to about once a check.
- **It reads well in the fiction:** the situation finds your weakness. It costs one glance per trick, at a card you already know you hold.

## Suggested next steps

- **Adopted:** survival target 4 × M (RULES.md). Watch whether four-Injury scans feel fair at 57% death.
- **Adopted:** the suit-then-trump tie-break (RULES.md).
- **Adopted:** Slip keeps its return, Stumble keeps Price, and a status in the world card's suit must be played (RULES.md).
- Playtest with real people to see whether yielding happens naturally, and whether Strength's edge is real.
- Decide whether busts should matter. If they should, try the hidden-value variant for tense scenes.
