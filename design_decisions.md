# Current rules have been consolidated

Use [RULES.md](RULES.md) as the full current reference and [PLAYER_GUIDE.md](PLAYER_GUIDE.md) at the table. Browser and text references are generated with `npm run build:guides`; shared card copy lives in `card_rules.js`.

Each player uses two standard decks: A–10 are ordinary cards and face cards are
statuses. From one deck, take 2, 4, 6, 8 of every suit, add A, 5, 9 of a
primary suit, and add 3, 7 of a different secondary suit. This gives 21 cards
distributed 7/6/4/4. These choices only determine starting cards. The remaining
cards and the full second deck form the reserve for gains and evolution.

Each player has one separate, fixed goal; wins cannot be pooled or transferred.
Checks may have 1–13 tricks; use one trick for quick resolution.
Cooperation happens through fiction and card play. Immediate threats can force
that goal, but the player chooses their approach. Brace adds or subtracts the
losing card's printed value from the owner's next play, minimum zero.
Played cards stay in their row until cleanup. Stumble replaces Dazed:
if anyone plays it, the world leads the next trick regardless of who won.
It follows normal play rules and stays in the row even on a win. Consolations resolve in
parallel before the next lead. Cleanup shuffles and discards leftovers,
then discards the played row chronologically, then adds consequences with
Injuries last; there is no suit or value sorting.
Survival scans occur at the
start of a check, for living characters only, and immediately whenever a
character gains an Injury. Injuries are gained only at cleanup or between
checks; Injury consequences during play wait for cleanup. There is no automatic
end-of-check scan. A gain-triggered survival check begins immediately, without rest.
Survival is the endangered player's forced goal, taking priority over other
goals at its recorded cost; only their own wins score it. Evolution is optional,
at most once per shuffle, in preparation or mid-check; a mid-check shuffle sets
the two statuses aside before shuffling and resolves the rest after the trick.
It consumes
two matching statuses, then draws three random ordinary cards of that suit from
reserve, keeps one in discard and returns the rest, or returns one card
of that suit from discard to reserve. All suits use the same rule. Reshuffling
does not automatically remove a status. Curses have no special play effect;
they share one supernatural compulsion. Each violation gains one Stress
per Curse outside reserve; count six minus the Curses remaining in reserve.
Stress duplicates whenever drawn, including redraws and mid-check draws:
gain one Stress from reserve into discard for each copy drawn.
Revelation replaces the next play's suit rather than adding a second suit.
Apply it for follow-suit, leading, and trump. Revelation's
suit change expires at check end; the status placed atop the deck stays there.

Each player and the world declare an approach and its personal trump before
drawing; both stay fixed for the check.
Highest personal trump wins across suits; otherwise highest led-suit card wins.
All planning and goal negotiation finish before anyone draws. Players choose
independently without tactical deliberation. [TRUMP_OPTIONS.md](TRUMP_OPTIONS.md)
preserves older alternatives.
Cards are played face up in turn order from the leader, with the world at the
GM's seat; there is no face-down commitment and no simultaneous reveal. The
highest trump takes the trick, then the highest card of any suit; ties break to
the led suit first, then to the earliest card played.
Earlier suggestions in the audit documents are historical proposals, not rules.
