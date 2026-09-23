# Complexity audit: shared bids, simpler statuses, no survival subgame

**Archived proposal. The current consolidated rules are [RULES.md](../../RULES.md).** This document records an earlier audit, including ideas that were rejected.

**Historical first proposal.** See [the later decision record](design_decisions.md) and [Iteration 2](complexity_iteration_2.md). The recommendations below are the original audit, not current rules.

Design proposal, 14 September 2026. This is a playtest draft, not a replacement for the published cards. The working baseline is `trick_rules_reference.txt`, including its existing local edits. Findings below are rule analysis; the proposed costs and pacing have not been validated in play.

## Recommendation

Resolve a consequential situation with **one shared seven-trick exchange**. Everyone declares a goal or supports someone else's goal. Each goal has a cost in tricks; tricks won by its participants accumulate toward that cost. Resolve the goals together.

Keep personal decks, follow-suit, trump, the open opposition hand, and hardship appearing in future hands. Simplify the procedures surrounding those decisions:

- Injury, Stress, and Dazed become ordinary zero-value cards in their existing suits.
- Curse keeps its agreed fictional obligation and special recovery condition.
- Remove the survival scan and automatic repeat checks. Use an ordinary rescue bid when someone is dying.
- Test shared bids without individual trick-loss consolations.
- Move evolution to the end of a session, away from reshuffling.

The important tradeoff: the simplest survival replacement makes death follow declared fictional danger. Injury accumulation still makes you less capable, but no longer independently triggers death through a card-count threshold.

## Where complexity is coming from

| System | Work it currently requires | What it contributes | Recommendation |
| --- | --- | --- | --- |
| Individual challenges | Frame, draw, play up to seven tricks, and clean up separately for each active character | Personal tactical attention | One exchange for everyone acting in the same situation |
| Survival | Check ordered discard; combine and shuffle; reveal repeated groups; calculate threshold; recombine and shuffle; draw; arrange a loan; play another challenge; check again | Mortal danger and a small helping opportunity | Replace the entire procedure with a rescue bid |
| Stress | Identify initial draws versus later draws; create copies; manage increasing deck size | Escalating mental pressure | Remove duplication in the first prototype |
| Dazed | Check mandatory-play priority on each trick, then check victory to determine card destination | Temporary loss of control | Use the common status rule first; consider one short exception later |
| Curse | Agree on an obligation, fulfillment, and consequences; remember it across scenes | Distinctive fictional trouble | Keep, with explicit and achievable terms |
| Loss consolations | Each loser may make a separate choice, stage a card, change a future play, draw, or manage a second suit | Tactical recovery and suit identity | Omit from the first shared-bid playtest; reassess after measuring pacing |
| Evolution | Count statuses across the whole deck, track four latches, choose suit-specific changes, use acquisition piles; can happen mid-challenge | Persistent character growth | One session-end growth opportunity, no latches |
| Recovery | Rest removal and one optional removal before reshuffling | Attrition relief | Keep initially; remove evolution from the shuffle procedure |
| Rules duplication | Consult sources that disagree | Nothing useful at the table | Choose one authoritative rules source before updating cards |

The underlying trick comparison is relatively compact. The largest costs are extra resolution cycles, timing exceptions, and bookkeeping between tricks.

For four characters whose actions would otherwise receive separate full checks, the maximum falls from 28 sequential tricks to seven shared tricks. Each shared trick still involves five cards, including the world, so this is a structural reduction rather than a measured claim of four-times-faster play. Existing rules already discourage checking every small action; retain that guidance.

### Why survival is especially awkward

The current trigger looks at the top seven cards of a discard pile the player may order freely. With enough other cards available, a player can bury Injuries below that window. If a new failure Injury is placed on top, burying the older Injuries can still avoid the two-Injury trigger. The rule rewards arranging the discard rather than making a decision in the fiction.

The threshold scan then penalizes status density, which also makes the subsequent hand worse. Two sources of difficulty compound, and the scan can introduce another shuffle without introducing a meaningful choice.

Finally, succeeding does not necessarily end the emergency: the resulting discard can immediately trigger another survival event. The fiction says “you survived,” while the procedure may say “do it again.” A shorter threshold formula would leave most of these problems intact.

## Shared exchange: a runnable first draft

### 1. Declare goals together

Before anyone draws, everyone says what they want to accomplish. Agree on concrete outcomes. The GM states each bid's trick cost and what happens if it fails. A bid here is a commitment to an outcome, not an auction or a prediction of an exact score.

Each participant joins one bid for the exchange. Multiple players can join the same bid by describing how they help. Helping contributes their won tricks; it does not add their card values together. Participants must be able to affect the situation in the fiction. An absent character cannot contribute simply by supplying another hand.

| Cost | Starting guideline | Example |
| --- | --- | --- |
| No check | No interesting uncertainty or consequence | Open an unguarded, unlocked door |
| 1 trick | A narrow, consequential gain | Grab the dropped key before it slides away |
| 2 tricks | A substantial, bounded outcome | Get one trapped person out of immediate danger |
| 3 tricks | A major change to the situation | Get the wagon and its passengers across the failing bridge |
| 4 tricks | An ambitious outcome with several benefits | Evacuate the camp with its supplies intact |

These are scope guidelines, not universal prices: opposition and established circumstances also matter. Agree on the cost before drawing. Do not add costs for every verb in a description. Reserve five to seven for exceptional bids during testing.

There are only seven tricks available across the entire table, including tricks taken by the world. Support improves a bid's chances of claiming those tricks; it does not create additional tricks. Do not multiply costs by the number of helpers.

Tell the table when its combined costs exceed seven. It may narrow goals, combine compatible goals at an appropriate cost, or knowingly choose which goals to prioritize. Four independent two-trick bids cannot all succeed in this prototype.

Lock membership and costs for this exchange. Players may coordinate card play, but cannot reassign already-won tricks or switch bids after seeing their hands. This makes the commitment to support meaningful and avoids another negotiation after every trick.

### 2. Frame one obstacle and deal

Use one trump suit for the exchange, chosen to reflect the central obstacle and stated before players commit. Players can describe different approaches within it; their bids do not each create a separate trump suit.

Each participant draws seven cards from their personal deck. Deal seven face-up world cards from the existing four-suit, 40-card challenge deck, freshly shuffled. Use the existing personal decks and starting point-buy rules.

The group chooses its first card leader before drawing; the world leads first if the fiction gives it the initiative, also announced before drawing. Leading a trick gives control of the led suit, not a separate turn of fictional action.

### 3. Play each trick

1. The leader plays one card face-up.
2. All other players choose legal cards face-down and reveal together. They must follow the led suit if able.
3. The world uses its leftmost legal card, following suit if able. Its deterministic reply is already knowable from the lead; the GM can indicate it while players choose. If the world leads, it plays its leftmost card.
4. Highest trump wins; otherwise highest card of the led suit wins. Off-suit non-trumps cannot win. A player's win adds **one** trick to their bid; a world win adds nothing to any player bid.
5. The winner leads the next trick. No individual loss consolations resolve in this prototype. Give the trick a brief fictional beat when it adds something; resolve the promised outcomes at exchange end.

Because personal decks permit duplicates, multiplayer ties need an explicit rule. For this draft: if the leader is tied for best, the leader wins. Otherwise, if all tied best cards belong to one bid, that bid wins one trick and its tied players choose the next leader. If the tie crosses bids or includes the world, nobody scores and the current leader leads again. Every card played is still spent. This tie rule is provisional; record how often it interrupts play.

Use a token or tally for each bid's score. Keep played cards associated with their owners for cleanup. A trick is always worth at most one point, even when several allies beat the world.

### 4. Resolve the exchange together

An uncontested bid succeeds if its score meets or exceeds its cost. Several compatible bids may succeed. Extra tricks do not buy undeclared benefits.

For mutually exclusive bids, first discard those that did not meet their costs. Of the qualifying bids, the one with the highest total score succeeds. If the highest qualifying scores tie, neither side secures its desired outcome; apply the predeclared stalemate. Compare total tricks, not excess tricks above cost. A cheaper bid is easier to qualify, but does not gain a bonus in the contest.

Specify incompatibility before play. “Convince her to come with us” and “convince her to stay and protect the village” are competing goals without requiring hostile characters or physical attacks. Do not give the losing side Injury merely for disagreeing. Consequences follow the established situation. For the first test, keep each contested set mutually exclusive; rewrite tangled, partially overlapping goals into clearer outcomes before dealing.

Reaching a contested bid's cost does not immediately settle it: another bid may finish with a higher score. There is no “first to the threshold” victory and no advantage from whose fictional declaration came first.

All participants continue to have a card in each remaining trick, even if their bid has already met its cost. Wins still belong to that bid. End early only when every bid's result is mathematically fixed, including contested rankings and ties. Otherwise play the seven tricks.

Discard all played and remaining hand cards to their owners' discards. Discard order has no core mechanical significance in this draft. Apply each bid's announced failure consequences once, to the named exposed characters. Joining a bid does not automatically mean taking a status on failure; establish each helper's exposure before dealing. Individual trick losses do not create status cards.

### Worked outcomes

**Cooperation:** Mara wants to get a trapped traveler free, cost two. Ivo supports her. Sen wants to recover a relic, cost three. Mara wins one trick, Ivo one, Sen three, and the world two. Both goals succeed. Ivo needed no separate helping check.

**Different priorities:** Mara wants to destroy a dangerous bell; Sen wants to take it intact for study. Each bid costs two. Ivo supports Sen. The destruction bid scores two, preservation scores three, and the world takes two. Preservation wins. The agreed consequence is that the bell remains a future danger, not that Mara suffers harm from losing an argument. If both bids score three and the world one, the predeclared stalemate applies: neither side secures the bell before the wardens arrive.

**Opportunity cost:** Rescue costs two and escaping with the treasure costs three. If rescue earns two, treasure earns two, and the world earns three, the person survives and the treasure is lost. Do not roll or play another check to establish either result.

## Status cards: keep the deck consequence, remove the trigger web

For the first test, use this common rule:

> Injury, Stress, Dazed, and Curse have value zero and their printed suit. They follow suit and compete normally, including winning as zero-value trump when no better trump is played. Gained statuses go into your discard. Drawing or playing them does not trigger another procedure.

Injury, Stress, and Dazed differ through their suits and fictional causes. Stress no longer duplicates. Dazed no longer forces play or changes destination. Injury no longer scans any pile or starts a check. A failed physical effort can cause Injury; a harrowing revelation can cause Stress even if the exchange's trump was another suit.

Curse keeps an obligation approved by the affected player, a clear achievable fulfillment condition, and agreed consequences for breaking it. It cannot impose unwanted player conflict or cross established table boundaries. Fulfilling the condition removes the associated Curse; rest and ordinary reshuffling cannot. Its fictional obligation is active independently of when its card is drawn. This is the one distinctive status exception retained in the first test.

Keep existing recovery initially: at a genuine rest, remove any number of non-Curse statuses from your discard; when a draw requires a reshuffle, optionally remove one eligible status, shuffle the discard, and continue drawing. No evolution happens there. Cards in hand or the play area are not part of that reshuffle. Recovery is not automatically granted after every exchange.

This sacrifices some mechanical personality. It preserves the more important experience of carrying trouble into future hands. If the statuses feel too interchangeable, the first exception worth testing is **“remove Dazed after playing it.”** That is one event and one destination, without mandatory-play priority or a win/loss branch. Add it only after testing the shared structure.

Divine and Blessed exist in the card assets but are outside the four-suit core text. Leave them out of this first prototype. A later simple Blessed rule could prevent one incoming status at the moment it is gained, instead of inspecting draw order; that would need its own acquisition and storage rule before use.

## Survival: make rescue one of the goals

Replace the existing survival section with:

> When a declared consequence would leave a character dying, mark them **Down** at the end of the exchange. In the next exchange, saving them is a two-trick bid. The endangered character can contribute through a plausible effort to survive, and any available ally can join. Resolve it alongside the other goals. Success stabilizes them and clears Down; failure means death. Existing Injury cards remain.

Declare mortal stakes before commitment. Ordinary failures do not unexpectedly become death checks. A Down character can participate in their rescue bid but cannot pursue another goal until stabilized; they still get normal card play, so the emergency does not automatically remove their player from the table. Stabilization takes effect at exchange end.

Run that next exchange before advancing beyond the rescue opportunity. If there is no other uncertain goal, it can be a rescue-only exchange using the same rules. If everyone abandons the rescue, resolve the declared consequence without dealing a ceremonial hand. If timely rescue is certain and unopposed in the fiction, stabilize the character without a check.

Use the approach appropriate to the actual rescue when choosing the exchange's trump; it need not always be Strength. If someone is already dying when a scene opens, announce the rescue bid during framing. If someone becomes Down as an exchange result, place it in the next exchange; never restart the completed one.

There is no separate injury-count trigger, threshold scan, loan card, special survival deck, or successful-survival retrigger. A new mortal consequence can create a new emergency later; the Injuries left in the deck cannot do so by themselves. Healing Injuries and stabilizing a dying person are different outcomes.

This is a tonal choice as well as a simplification. If automatic cumulative-wound lethality is essential, that needs a separate design decision. Reintroducing a numeric trigger now would obscure whether the simpler rescue structure works.

## Other changes needed around the prototype

**Consolations:** A shared trick can leave several player losers. Porting every personal consolation unchanged produces multiple effects between reveals; it also lets someone gain consolation for losing to their own helper. Reposition can receive conflicting instructions, and Revelation creates temporary dual-suit states in a larger comparison. Test without these first. This removes a meaningful source of suit identity and tactical recovery, so evaluate that loss explicitly rather than assuming it is free.

**Growth:** At session end, each player may name one hardship that changed them and make one deck change: use the existing Add procedure for the relevant suit, or remove one non-status card while preserving the seven-card floor. No status-count qualification, per-suit latches, or mid-hand acquisition piles. This is a proposed replacement for advancement timing and frequency; it is not needed to score a single test exchange.

**Abilities and items:** Test the core with personal decks and statuses first. Existing abilities need an explicit migration pass before calling this a complete game revision:

- Hearthhide Coat and Dying Ring refer directly to survival checks.
- Hollow Blindfold can win an entire individual challenge from one trick; it needs a bid-scoped interpretation and contest rules.
- Hushbell Chain assumes the only potential leaders are its user and the open hand.
- Wake Lantern adds another hand, which now affects an already multiplayer trick.
- Grip Bone prices an effect through a consolation restriction.
- Race features depend on check suits, extra draws, reshuffle recovery, status triggers, and hand resets. For example, Moon-Eyed recovery still has an identifiable hook; Rootborn growth and Ashcrik's fasting cycle need review against the new advancement timing.

Do not assume a renamed “check” automatically makes these compatible. In particular, extra cards must not silently add extra tricks to the shared seven-trick budget.

## Existing source disagreements

These are independent sources of learning friction, even before redesign:

| Topic | Working text reference | Other current material |
| --- | --- | --- |
| No trump played | Highest card of the led suit | `reference.html` and the v4 HTML say highest card of any suit |
| Survival threshold | Repeated three-card reveal scan | v4 HTML instructs counting statuses in discard |
| Injury/death | Two Injuries in the top seven discard cards trigger survival | `reference.html` includes fourth-Injury-drawn death and a two-Injury-in-hand trigger; `card_descriptions.txt` also states fourth-drawn death |
| Evolution | Two statuses qualify; resolved suits latch | `reference.html` uses three; v4 HTML allows repeated triggering from retained statuses |
| Dazed removal | Removed on a trick win | `card_descriptions.txt` says removed on play |
| Suit set | Four core suits | Rendered deck also includes Divine and Blessed |

After the design settles, update the text reference, HTML references, individual card text, item catalog, race rules, and generated exports together. The existing local changes to the text reference are preserved by this audit.

## What to learn from the first playtest

Start with seven tricks so the shared format can be evaluated before also changing hand size. Test a cooperative rescue, a scene with several compatible goals, and a nonviolent contest.

Record exchange duration, time spent agreeing bids, rules lookups, frequency of ties, tricks won by the world, and whether players feel useful while supporting. These are proposed measurements, not results from an executed playtest.

Watch these failure modes:

- **Negotiation replaces card bookkeeping.** If pricing goals takes longer than the old checks, narrow the cost guide and frame broader outcomes.
- **Large coalitions overwhelm the world.** More allied hands may make it easier to claim most tricks. Shared scarcity still limits the number of goals, but does not guarantee dangerous opposition. Compare solo and group scenes before changing the world hand or costs.
- **One strong deck dominates.** Supporters may contribute good positioning without often winning, but that must still feel satisfying. Observe rather than assume their participation fixes spotlight balance.
- **Trump sidelines a whole approach.** One shared trump is simple, but can privilege certain decks. Vary the central obstacles across scenes and check how often anyone feels unable to help.
- **Locked bids become frustrating after early success.** A player keeps participating but cannot redirect extra wins. If this feels worse than the commitment is worth, test prospective switching once at a fixed midpoint; do not introduce free reassignment of banked tricks.
- **The simplified statuses lose too much identity.** Restore one short exception at a time, beginning with Dazed clearing on play.

If exchanges remain slow after these cuts, test five-card hands and lower bid costs together. Simply removing two tricks while retaining the seven-trick cost scale would make many shared goals impossible.
