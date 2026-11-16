# Simpler checks: options, November 2026

A design exploration, not a rules change. [RULES.md](../../RULES.md) stays authoritative until something here is playtested and adopted.

The goal is a check with less procedure that keeps what works: everyone acting in the same scene at once, persistent character decks, statuses that clog the deck, evolution, survival, and goals with costs. Part 1 stays inside trick-taking. Part 2 offers three resolutions that aren't trick-taking. They are deliberately different from [Joinery](JOINERY.md) (exact-total projects) and [Undertow](UNDERTOW.md) (push-your-luck runs).

## Where the procedure comes from

| Pain point | Rules it costs today |
| --- | --- |
| **Consolations** | Four different effects, a resolution window between tricks, "no stacking" for Brace, Brace's printed-versus-effective value distinction, Reposition's "counts as unable to follow", Recalculate's reshuffle-evolve exception, and Revelation's temporary suit change, which needs its own paragraph explaining how follow-suit and trump treat the borrowed suit. |
| **Conflicting trump** | Each card is trump only for its owner, and only if the owner couldn't follow. To compare one trick, you need every player's approach *and* whether each of them could have followed. Several players can play "trump" in different suits, and the order of play breaks ties. |
| **Leading and following** | Turn order, who leads, "the leader never plays trump", the world's leftmost-legal-card rule, sitting out when a hand is empty, Stumble moving the lead, and an enforcement rule, follow-suit, that the table has to check. |

Most of this comes from one source. **A player leads, and the rest answer them in turn.** Remove the player leader and the other two problems get much smaller.

---

# Part 1: Inside trick-taking

## The core: *the world leads, everyone answers*

1. **The world always leads.** Deal the world's N cards face-up in a row, as now. Each trick, the next world card is the lead.
2. **Everyone else plays at once.** Each player chooses one card face-down, then all reveal together. There is no turn order, no seat advantage and no follow-suit rule.
3. **A card is *on* or *off*.** Your card is **on** if its suit matches the world's card *or* your declared approach. Otherwise it is **off** and cannot win.
4. **The highest *on* card that beats the world's card wins.** The world wins ties against players. Players who tie each other both score.

That is the whole trick. Every card raises one yes-or-no question (is it on?) followed by a value comparison. No player's trump ever outranks another's: your approach suit and the situation's suit are just two ways to be on.

> The world leads 7♦ (Intelligence). Ana (Strength approach) plays 8♥, which is on through her approach. Ben (Dexterity) plays 9♦, which is on through the situation. Cara (Weird) plays 10♠, which is off. Ben's 9 is the highest on card above 7, so Ben scores.

**What it deletes:** turn order, leading, follow-suit, the trump definition, the "leader never trumps" note, the world's legal-play rule, sitting out, and the whole *Suit changes* section. The world also no longer needs a declared approach. Its cards *are* the situation.

**What it keeps:** the world row is visible from the start, so players can plan which card answers which trick. The table still divides N tricks, and the no-tactical-talk rule gains teeth. Two allies who both beat the same world card waste one of those cards. This collision is now the main tension. In a rough simulation with greedy players (3 players, 7 tricks), about 0.5 cards per trick were wasted this way.

### Calibration (rough simulation, 21-card starter, greedy play)

| Players, tricks | World takes | Typical player score | P(score ≥ 2) |
| --- | --- | --- | --- |
| 2, N = 5 | 47% | 1–2 | 48% |
| 3, N = 7 | 38% | 2 | 63% |
| 4, N = 9 | 33% | 2–3 | 75% |

The existing cost guide (1 narrow, 2 modest, 3 substantial) works without change. Real players planning against the visible row will do better than greedy ones. The world probably needs a little help at larger tables; see *Dials* below.

## Variant B: *beat the world* (several winners per trick)

Same as the core, except **every player whose on card beats the world's card scores**. Players never compete with each other for a trick, so there is nothing to coordinate and no collisions.

Add one shared stake: **if no player beats the world's card, the world scores.** World wins count toward a threat clock or an agreed group consequence. The party therefore wants at least one strong answer every trick, even with separate goals.

Scores run higher (3 players, N = 7: a median of 3 per player). Set costs at roughly **half the number of tricks** for a modest goal. This is the simplest version. The cost is that the "N tricks to share" budget disappears, and so does the tension between allies.

## Variant C: *ties cancel*

The core, but **players who tie each other both lose**, and the next-highest on card is checked instead (as in *Raj* and *Hol's der Geier*). This makes the no-signals rule central: reading what your ally will play without talking becomes the skill. It is the most interesting option with experienced players. It also feels the most punishing, so test it after the core.

## Replacing consolations

Pick one. All three run with any variant above.

**1. Approach perks (recommended).** Each suit gives one perk to whoever declares it as their approach. It resolves once at the start of the check, never between tricks.

| Approach | Perk |
| --- | --- |
| **Strength: Weight** | Your approach-suit cards count +1. |
| **Dexterity: Footwork** | You win ties, including against the world. |
| **Intelligence: Preparation** | Draw N + 2, then discard 2 before the first trick. |
| **Weird: Omen** | Before goals are set, ask the GM one question and receive a brief, truthful answer. |

This removes all per-trick procedure. Suits still feel different, and the choice of approach now carries a real mechanical choice.

**2. One universal consolation.** On a loss, you may discard a card from hand and draw one. This keeps the deck churning and gives losers a reason to play, in one sentence.

**3. Win effects instead of loss effects.** Only the trick winner resolves their winning card's suit power. That means at most one effect per trick instead of up to four.

## Statuses and Blessed under the core

- Statuses are worth zero, so they can never beat the world. They are dead cards in hand, which is exactly how a clogged deck should feel.
- **Stumble** loses its job, because the world always leads. Proposed replacement: *if Stumble is in your hand, you must play it before any ordinary card.* You lose your next trick.
- **Injury, Stress and Curse**, survival scans, rest and evolution are unchanged. With Recalculate gone, evolution happens only on ordinary reshuffles.
- **Blessed** wins any trick it is played in. Two Blessed both score.

## Dials

- **World strength:** at 4 or more players, the world adds +1 to every card.
- **Suspense versus planning:** flip each world card only as its trick starts, instead of showing the row. This makes play more improvised and makes plans less reliable.
- **Contracts instead of costs (optional):** each player bids how many tricks they'll take, which sets their ambition, instead of negotiating a cost from the guide. The more a player bids, the bigger the outcome they get. Falling short fails. This replaces a negotiation step with a mechanic, but adds a bid.

## Rejected inside trick-taking

- **Plurality trump** (the most-played suit wins). Already tried and superseded.
- **Shared changing trump** and **led-suit only, no trump.** See [TRUMP_OPTIONS.md](../history/TRUMP_OPTIONS.md). Both keep a player leader and follow-suit, which are the root of the procedure.

---

# Part 2: Outside trick-taking

All three keep personal decks, statuses (face cards, worth zero), evolution, survival and simultaneous play. None has a player leader or follow-suit.

## 1. Fronts: hidden allocation against the world

**Question it asks:** *where do we put our strength?* (Colonel Blotto against the GM.)

1. **Lay out one front per goal**, plus one for the immediate threat if there is one. Deal each front **one world card face-up and one face-down**. The front's strength is their total, and its suit is the suit of the face-up card.
2. **Players draw 6.**
3. **First commitment.** Everyone simultaneously places any number of cards face-down on any fronts, then reveals.
4. **Second commitment.** With the first wave visible, everyone commits again from what's left, then reveals.
5. **The world reveals its hidden cards.** A front where the players' total beats the world's holds, and its goal succeeds.

**Counting:** a card counts its full value if it matches the front's suit or your approach. Otherwise it counts 1, as half-hearted help. Statuses count 0.

**Cooperation:** fronts pool everyone's cards. This is a deliberate break from Trick's rule that wins are never pooled. Spreading out versus piling up is the whole game.

**Risk:** a front that falls exposes everyone who committed a card to it. Its consequences, statuses included, apply to them. Holding back is safe, but it lets your allies fall.

**Why it fits:** it suits fights, chases and heists with several things happening at once. There are two reveals per check and no per-card procedure. The GM's face-down cards produce bluff and dread without needing a GM hand.

**Risk to test:** do two commitment rounds give enough decision, or does everyone simply dump everything? A hand cap (say, 6 cards for two rounds) is the main dial.

## 2. Showdown: poker hands from the situation

**Question it asks:** *does what I brought fit what's here?* This is the fastest option, and most tables already know the hand rankings.

1. **The GM deals 3 community cards face-up.** They are the situation.
2. **Each player draws 4.** Statuses in your draw are blanks and can't join any combination.
3. **Optional backup:** after everyone reveals, each player may slide one unused card to another player.
4. **Each player makes their best 5-card hand** from their own cards plus the community. The hand must use **at least one of your own approach-suit cards**, or it drops one rank.

**Difficulty by hand** (simulated odds with the 21-card starter, 4 private + 3 community):

| Goal | Needs | Starter odds |
| --- | --- | --- |
| Narrow | Pair | ~97% |
| Modest | Two pair | ~72% |
| Substantial | Three of a kind | ~37% |
| Ambitious | Straight or better | ~26% |

**Deck identity is strong and visible.** The starter's 2-4-6-8 in every suit makes pairs common. A deck built toward odd ranks opens up straights, and a deep primary suit opens up flushes. Every gain and evolution changes your odds in a way players can feel. Statuses directly shrink a hand.

**Incompatible goals:** the better hand wins. A tie gives the agreed stalemate.

**Longer scenes:** chain showdowns, one per beat, each with a fresh draw and fresh community cards.

**Risk to test:** a single reveal may feel thin for big scenes. If so, play the hand in two streets (2 community, then 1 more) with one redraw between them.

## 3. Counter: a suit wheel, simultaneous duels

**Question it asks:** *what will the world do, and what beats it?* Rock-paper-scissors with values.

**The wheel:** each suit beats the next:

> **Strength** breaks **Intelligence** (plans fail under force), which sees through **Weird**, which reads **Dexterity** (intuition catches the deceiver), which evades **Strength**.

Opposite suits (Strength–Weird, Intelligence–Dexterity) and matching suits compare value.

1. **The GM holds a world hand of 3** and refills it after each exchange. The GM *chooses* the world's play, which brings back GM agency and lets the GM telegraph intent through narration.
2. **Each exchange,** the GM and every player place one card face-down, then reveal.
3. **Each player duels only the world's card.** Win: score 1 toward your goal. Lose on value: nothing happens. **Lose to the wheel:** gain the status of the world card's suit (Injury from Strength, Stumble from Dexterity, Stress from Intelligence, Curse from Weird).
4. Play N exchanges.

**No declared approach:** each card *is* your approach for that moment, and the GM can close a suit off when the fiction does ("you've been spotted, so no Dexterity this exchange"). Routine harm comes straight from the wheel, so less needs negotiating before a check.

**Why it fits:** duels, social contests and anything where reading your opponent is the point. Players never compare against each other, so trump can't conflict.

**Risk to test:** status gain on every wheel loss may be too lethal, since Injuries pile up fast. The dial is *wheel losses apply only on the world's approach suit*, or *only when the GM pays a card from a threat pool*.

---

## Recommendation

**Playtest the core trick (*the world leads, everyone answers*) with approach perks first.** It deletes all three pain points while leaving decks, statuses, evolution, survival, goals and costs intact. It needs no new components; the card faces and reference card would need their consolation text replaced with the perks.

If you want a clean break instead:

- **Counter** is the nearest relative. It is still one card at a time against the world, with the suit relationships made explicit.
- **Showdown** is the fastest and easiest to teach.
- **Fronts** is the most cooperative and tactical, and the best fit for multi-part scenes.

All numbers here come from quick simulations with greedy or random play. Nothing has been playtested.
