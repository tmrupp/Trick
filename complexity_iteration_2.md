# Iteration 2: a scene played through one shared hand

**Archived proposal. The current consolidated rules are [RULES.md](RULES.md).** Its fixed-goal and beginning/end survival rules supersede this iteration.

**Historical proposal.** See [current decisions and open questions](C:/Users/tmrup/Documents/Trick/design_decisions.md) for the accepted original Recalculate/Revelation effects and the newer discussion of evolution and discard-based rescue. In particular, this document's no-draw and conserved-opening-hand assumptions are superseded.

Design draft, 14 September 2026. Supersedes the first audit's recommendations. This is a proposal for discussion and playtesting; the core reference and existing cards have not been rewritten.

The priorities are now clearer: larger shared hands can carry the unfolding scene; consolations should affect their owner without competing instructions to the world; different characters need different routes to success; death must have a mechanical trigger and consequence; bad cards accumulating in the deck and driving evolution matter more than preserving four separate status effects.

## 1. Give the scene enough tricks

Start with **11 tricks** as the default. Use seven for a brief situation and thirteen for a broader scene with several moving parts. Choose the length before drawing or committing to bids. These are three presets, not a formula based on player count.

Length determines how much can happen. Severity comes from goal costs, opposition, and the announced consequences. A thirteen-trick scene gives players more opportunities than an eleven-trick scene, so increasing the hand size alone does not make a situation harder.

Use initial cost anchors of two tricks for a modest outcome, three for a substantial one, and five for an ambitious one. One-trick opportunities can exist when consequential. Do not inflate every cost merely because the scene is longer; use the additional budget to accommodate more outcomes. All costs are provisional.

Each character draws the chosen number of cards from their own deck; the world receives that many face-up cards from its challenge deck. There is still only one awarded point per trick across the table. Helping improves who claims the budget, not its size.

The old minimum of seven non-status cards is insufficient for thirteen-card hands. This draft raises that floor to thirteen; the existing twenty-one-card starting deck can stay. Fill the opening hand using the normal draw-and-reshuffle process, including the existing optional removal of one non-Curse status when reshuffling. Evolution moves out of the shuffle procedure. Under the unified status proposal below, all ordinary statuses are eligible for this recovery.

The proposed consolation effects do not draw fresh cards, so the base rules need no further shuffles once scene play begins. Abilities that add draws require a later compatibility pass.

## 2. Let play change what people prioritize

Agree on the available goals, costs, incompatible outcomes, and failure consequences before dealing. After the opening status check, add any compulsory rescue goals and allow players to reassess their priorities before the first trick.

Before committing each card, a player names which goal their win would advance. This can be their own goal or someone else's, with a plausible contribution in the fiction. The commitment is locked before the simultaneous reveal. Earlier points cannot move between goals.

This changes the first draft's scene-long support commitment. A character can secure the door, then help with the rescue. They pay for helping with each trick they direct there. Agree on the destination briefly rather than reopening bid pricing each time.

An uncontested goal takes effect when its cost is paid. Mark it complete; subsequent tricks can go elsewhere. For opposing goals, reaching the cost establishes a qualifying bid, but their relative scores are settled at scene end: among qualifying bids, the highest score wins; a highest-score tie produces the predeclared stalemate. Use mutually exclusive contested sets in the initial tests.

Narrate the winning trick as progress toward its committed goal. A world win supplies a setback or worsening position. These beats should develop the scene without silently increasing a paid cost, undoing a completed outcome, or granting unpriced harm. A contested goal's progress remains provisional until the contest is resolved.

No character gets a separate fictional turn merely because they lead the card trick. Followers choose simultaneously after seeing the lead; their actions occupy the same fictional interval.

## 3. Trial an approach suit for each participant

A shared scene-wide trump privileges one approach across unrelated goals. The leading candidate to test is **a personal approach suit**, declared before drawing and fixed for the scene:

- A character forcing a way through chooses Strength.
- A character arranging an escape through deception chooses Dexterity.
- A character coordinating the evacuation chooses Intelligence.
- A character bargaining with the bridge's spirit chooses Weird.

The world also has one declared approach suit representing its opposition. Supporting a different goal does not change your approach suit within the scene; describe how your chosen approach helps. This prevents selecting a new trump to match each card in hand.

Compare all cards using the same three categories:

1. A card matching **its owner's approach** counts as trump. Highest value among these wins.
2. If there is no such card, highest value in the led suit wins.
3. Off-suit cards that are not their owner's trump cannot win.

Follow-suit remains mandatory when possible. Different trumps share the same ranking category; there is no suit-against-suit dominance chart or separate winner for each player.

Example: a Strength character leads Strength 7. An Intelligence character with no Strength can play Intelligence 8. Both are trump for their respective owners, so the 8 beats the 7. An off-suit card of value 10 that is not its owner's approach cannot beat either.

The lead describes immediate pressure and card constraints, not a requirement that everyone narrate the same method. If that distinction is persistently awkward in play, test ordinary no-trump tricks instead. Removing follow-suit immediately would erase a major tactical constraint and make personal trumps much easier to play on demand.

This proposal adds one visible suit marker per participant. It buys approach freedom at a real cost in comparison effort. It also risks rewarding single-suit decks and repeatedly choosing one's best suit. Those are open balance questions, not problems assumed solved by the fiction.

Keep the deterministic world play: leftmost legal card, following the led suit if possible; leftmost card when it leads. The previous winner leads next. For duplicate best cards, use the first draft's provisional tie rule: the leader wins if among them; otherwise one shared committed goal receives one point if all tied cards advance it, and its tied players choose the next leader. If tied cards advance different goals or include the world, nobody scores and the current leader leads again.

## 4. Consolations that only alter your own play

You may take the consolation printed on your card **if the goal you committed to did not win this trick**. Losing to a teammate advancing the same goal grants no consolation. If the world wins, all players are eligible. An unscored tie also leaves players eligible.

| Printed suit | Proposed consolation | State affected |
| --- | --- | --- |
| Strength — Brace | Set aside your losing card. Add its value to your next played card, then place it with your spent cards. | Your next value |
| Dexterity — Reposition | On your next trick, you may ignore follow-suit. Normal ranking still applies. | Your next legal plays |
| Intelligence — Recalculate | Exchange one card remaining in your hand with one of your own previously played cards from this scene. | Your hand and spent cards |
| Weird — Revelation | Choose a suit represented by a status among your own scene cards. Your next card uses that suit instead of its printed suit. | Your next suit |

For Revelation, announce the borrowed suit when gaining the effect. It applies to both following and ranking, including personal trump. Only the resulting single suit is used; there is no dual-suit state. If it leads, that resulting suit is the led suit. The card's printed suit still determines any consolation earned by losing it.

These effects resolve simultaneously after the trick is scored and before the next lead. They cannot retarget the world hand, overwrite another player's choice, or change an already resolved trick. They still influence future competition, as useful abilities should.

Brace, Reposition, and Revelation expire on your next play or when the scene ends. A staged Brace card cannot be retrieved while its bonus is pending. Recalculate swaps one-for-one, gives no extra trick, and does nothing when there is no remaining hand card or eligible played card to exchange. It may retrieve the card just played. Card ownership never changes.

Each player keeps their own scene cards together: hand, spent pile, and any staged card. A card swapped out of hand joins that player's spent pile. This conserves the original scene-card pool and lets all players handle their effects without a shared resolution order.

Recalculate is a substantial change from drawing a fresh card: it offers reliable reuse instead of an unknown draw. It could be strong enough to need a restriction after testing. The speed benefit is eliminating draw triggers and mid-scene shuffles from the base loop.

## 5. One ordinary status rule, with one mechanical danger threshold

The user's priority is the deck's accumulation of bad cards and the growth they enable. Use **one ordinary status card rule with four printed suits**:

> A status has value zero and its printed suit. It enters the discard when gained. It follows suit, can count as its owner's trump, and otherwise plays normally. It has no duplication, compulsory-play, or win-dependent removal effect.

Injury, Dazed, and Stress can remain the names of the Strength, Dexterity, and Intelligence versions. Use **Dread** as a proposed name for the ordinary Weird version, so a mechanically ordinary card does not imply that every copy requires a separately negotiated curse.

Actual curses can remain specific fictional obligations on a relic, bargain, or curse note. Removing an ordinary Weird status does not fulfill that obligation. This is a proposed separation of supernatural obligations from ordinary deck pollution; existing Curse cards and removal rules require explicit migration before the revision is used in an ongoing campaign.

The simplification is more than removing card text: this draft removes Stress copying, Dazed priority and destination rules, Curse-specific ordinary recovery, all-status survival scans, and evolution latches. The same finite scene-card pool supplies danger and growth. Status effects are not replaced with four new tracks.

### Mechanical death and rescue

**After completing the opening hand, reveal and count your Injury cards. Two or more create a rescue goal costing three tricks. If that goal is incomplete at the end of this scene, your character dies.**

These are the suggested first-test numbers: two Injuries to trigger, three tricks to rescue. They are not tied to a GM declaration of mortal stakes and cannot be waived because the current scene seems safe. Fiction must explain the crisis revealed by the cards.

You and any available allies may direct trick wins to your rescue. You can instead spend your remaining efforts on another goal; the rule does not remove your ability to play. Multiple dying characters create separate rescue goals. Three wins rescue one named character, not everyone.

The emergency is fixed by the completed opening hand. Moving an Injury out of your hand with Recalculate does not cancel it. Completing the rescue stabilizes you for this scene and ends that goal. The opening test happens only once; the same cards cannot restart it.

There is no threshold-generation scan, separate survival hand, loan card, GM override, or rest before the deadline. In a rescue-only scene, play the same shared hand. Do not let an optional early ending avoid the required rescue result. If survival becomes mathematically impossible, its outcome is fixed.

Statuses gained as end-of-scene consequences enter the discard for future hands; they do not retroactively change the opening count. Death resolves before evolution or end-of-scene recovery, so removing the dangerous pair through growth cannot substitute for paying the rescue cost.

Hand size changes the danger. In a freshly shuffled pool of twenty-one ordinary cards and exactly two Injuries, the chance of drawing both is about 8.3% in seven cards, 21.7% in eleven, and 30.8% in thirteen. These are exact opening-hand probabilities for that specified pool, not overall campaign death rates. Existing recovery and deck history change the pool. The larger-hand design therefore needs fresh attrition testing.

## 6. Evolve by spending the hardship that surfaced

At scene end, after resolving survival and before adding new consequence cards:

> For each suit, you may remove two matching status cards from your scene cards to evolve once in that suit. Choose either to draw three cards from that suit's acquisition pile and keep one, or permanently remove one ordinary card from your deck. Preserve the thirteen-non-status-card minimum.

Only statuses from this scene's original hand qualify. In the base prototype, those cards are still together in your hand, spent pile, and staging area; no one needs to search an unseen draw pile or remember which statuses already advanced them. A card retrieved with Recalculate is still the same card and cannot count twice.

The consumed status pair provides the reset. There are no per-suit latches, no repeated evolution from the same two cards, and no whole-deck status census during a reshuffle. One evolution per suit per scene limits a hand containing several pairs. A player can decline and retain the statuses.

This retains growth through actual deck pollution. Merely receiving two new statuses in the current scene does not immediately buy growth: they must first cycle into a later hand. Surviving an Injury emergency can therefore lead directly to consuming that pair and changing your deck.

The common Add-or-Remove choice is a proposed simplification of the existing four suit-specific menus. Matching suit still determines acquisition, so the kind of hardship shapes what can be learned. If the individual evolution rewards are important in play, they can be restored without restoring latches; the consumption trigger is the central improvement.

After evolution, discard the remaining scene cards, add announced consequence statuses, and proceed with normal between-scene recovery. Rest removes ordinary statuses from the discard; it does not fulfill separate curse obligations.

## A scene in eleven tricks

Three characters want to extract a trapped expedition. They establish three goals: evacuate the people for three tricks, recover the expedition's records for two, and secure its valuable equipment for three. They declare different approaches: Strength, Intelligence, and Dexterity.

The opening hand reveals two Injuries for one character. Their rescue adds a compulsory three-trick goal. All desired outcomes now require eleven player-won tricks; any point taken by the world will force a sacrifice.

The hand finishes with three points on rescue, three on evacuation, two on records, one on equipment, and two taken by the world. Narration has followed the rescue, the people reaching safety, and the recovery of the records. The equipment is lost. The rescued player may consume the two Injuries to evolve at cleanup. If rescue had only two points, that character would die even if the other goals succeeded.

## What remains uncertain

This has been checked for the basic trick budget, card conservation under swaps, the order of death and evolution, and the explicit opening-hand probability example. It has not been playtested or simulated for balance.

The first tests should focus on eleven versus thirteen tricks; approach trumps versus ordinary no-trump; how often private consolations still pause the table; whether Recalculate produces repetitive reuse of strong cards; and how fast larger hands both expose fatal Injury pairs and consume statuses through evolution.

World-hand strength still needs testing against several allied personal hands. A larger budget and more participants do not guarantee appropriately dangerous opposition. Keep the existing twenty-one-card deck construction for initial comparisons, while enforcing the higher minimum after evolution.

Existing race abilities, Divine/Blessed, and items are not automatically compatible. In particular, draw effects break the conserved opening-card pool, global leader-control effects need rewriting, and survival-specific items need rescue rules. The separate curse treatment also changes the Weird Bargain. Migrate these only after choosing the central scene rules.
