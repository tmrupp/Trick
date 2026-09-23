// Text for the two-sided rules reference card. RULES.md is the full reference
// and PLAYER_GUIDE.md the condensed one; this card carries only table procedure.
globalThis.TrickRulesCard = {
  accent: "#2f6ca3",
  sides: [
    {
      id: "rules-front",
      side: "front",
      title: "TRICK",
      subtitle: "Table reference · front",
      sections: [
        {
          heading: "Set the check",
          lines: [
            "Set N from 1–13. Usually use 2p + 1 for p players, or 1 for a quick check.",
            "Scan every discard for survival before drawing or reshuffling.",
            "Agree goals, costs, and failure consequences. Each player has one goal and scores only their own wins.",
            "Each player and the world declare a fitting approach. Its suit is their fixed personal trump. The GM has final say.",
            "The world leads first unless the GM specifies. Everyone draws N; deal the world face-up in a fixed row."
          ],
          note: "Cost: 1 narrow · 2 modest · 3 substantial · 5 ambitious."
        },
        {
          heading: "Every trick",
          lines: [
            "Play face-up from the leader, clockwise, with the world at the GM's seat. Follow the led suit if able.",
            "The world plays its leftmost legal card.",
            "A card is trump if its suit matches its owner's trump and its owner could not follow the led suit.",
            "Highest trump wins; without trump, highest card of any suit. Break ties by led suit, then earliest played.",
            "The winner scores 1 trick toward their own goal; world wins score nothing.",
            "The winner leads next, unless anyone played Stumble: then the world leads."
          ],
          note: "Once drawing begins: no tactical talk, card advice, or signals. Narration, rules questions, and declarations are welcome."
        },
        {
          heading: "Consolations, on your trick loss",
          rows: [
            { label: "Spades — Brace", text: "Add or subtract the lost card's printed value on your next play, minimum 0. Braces never stack." },
            { label: "Clubs — Reposition", text: "Ignore follow-suit on your next play; it counts as being unable to follow." },
            { label: "Diamonds — Recalculate", text: "Discard 1 card from hand, then draw 1." },
            { label: "Hearts — Revelation", text: "Ask one question for a brief true answer, or put a status atop your deck; next play, your whole hand takes its suit for following, leading, and trump." }
          ],
          note: "Use your card's printed suit, even when an ally won. After the final trick, only Revelation's question remains."
        }
      ]
    },
    {
      id: "rules-back",
      side: "back",
      title: "TRICK",
      subtitle: "Table reference · back",
      sections: [
        {
          heading: "Statuses, J Q K, value 0, six of each",
          rows: [
            { label: "Injury — Spades", text: "Gain only at cleanup or between checks, then scan for survival." },
            { label: "Stumble — Clubs", text: "If anyone plays it, the world leads the next trick, whoever won." },
            { label: "Stress — Diamonds", text: "Whenever you draw Stress, gain another into discard. Redraws and mid-check draws count." },
            { label: "Curse — Hearts", text: "Your Curses share one compulsion. Each violation gains 1 Stress per Curse outside reserve. Only evolution removes them." }
          ],
          note: "Gain statuses into discard. If none remain in reserve, gain no copy."
        },
        {
          heading: "Blessed, your four Jokers",
          lines: [
            "Blessed wins any trick it is played in. It has no suit, is always legal, and sets no led suit when led. Two in one trick go to the earliest played.",
            "A played Blessed returns to reserve and never reaches discard or a survival scan.",
            "Between tricks you may give yours to another player, then draw 1. That handover is the only signal allowed."
          ]
        },
        {
          heading: "Reshuffle, evolution, rest",
          lines: [
            "When you must draw from an empty deck, evolve once per shuffle if you like, then shuffle discard.",
            "Evolve: return 1 of 2 matching statuses in discard to reserve. Then either draw 3 random ordinary reserve cards of that suit and keep 1 in discard, or return 1 ordinary card of that suit to reserve.",
            "At a GM-granted rest, remove any number of non-Curse statuses from discard."
          ]
        },
        {
          heading: "Finish and survive",
          lines: [
            "A goal succeeds when its score meets its cost. Among incompatible goals, the greatest margin over cost wins; a tie gives the agreed stalemate.",
            "Clean up: shuffle unplayed cards and discard them, discard your played row earliest to latest, then add consequences on top with Injuries last. Never rearrange discard.",
            "Count M Injuries in your top N discard cards. Two or more force survival as your goal, costing M tricks. Failure means death."
          ],
          note: "Scan at check start with the coming N, and on any Injury gained with the last check's N — that check follows at once, with no rest."
        }
      ]
    }
  ]
};
