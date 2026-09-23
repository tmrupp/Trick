// Text for the rules reference cards: the one hand-written summary of RULES.md.
// RULES.md is the single source; update these cards whenever a rule there changes.
// Two cards, four sides, printed at a readable size. A row's suit prints its label in that suit's ink.
globalThis.TrickRulesCard = {
  "sides": [
    {
      "id": "rules-1-front",
      "card": "rules-1",
      "side": "1-front",
      "title": "Trick",
      "subtitle": "Table reference · 1 of 4",
      "sections": [
        {
          "heading": "Set the check",
          "lines": [
            "Set N from 1–13: usually 2p + 1 for p players, or 1 for a quick check.",
            "Scan every discard for survival before drawing or reshuffling.",
            "Agree each goal, its cost, and its failure consequence. Each player scores only their own wins.",
            "An immediate threat can force your goal; you still choose the approach.",
            "Each player and the world declare a fitting approach; its suit is their personal trump for the check. The GM has final say.",
            "The world leads first unless the GM says otherwise. Everyone draws N; deal the world face up in a fixed row."
          ],
          "note": "Cost: 1 narrow · 2 modest · 3 substantial · 5 ambitious. On failure, each exposed participant gains a fitting status."
        }
      ]
    },
    {
      "id": "rules-1-back",
      "card": "rules-1",
      "side": "1-back",
      "title": "Trick",
      "subtitle": "Table reference · 2 of 4",
      "sections": [
        {
          "heading": "Every trick",
          "lines": [
            "Play face up from the leader, clockwise, with the world at the GM’s seat. Follow the led suit if able.",
            "The world plays its leftmost legal card.",
            "A card is trump if it matches its owner’s trump suit and its owner could not follow.",
            "Highest trump wins; with no trump, the highest card of the led suit. Ties go to the earliest played.",
            "The winner scores 1 trick for their own goal; world wins score nothing for players.",
            "The winner leads next, unless anyone played Stumble: then the world leads."
          ],
          "note": "Once drawing begins: no tactical talk, card advice, or signals. Narration, rules questions, and declarations are welcome."
        },
        {
          "heading": "Blessed, your four jokers",
          "lines": [
            "The GM grants a Blessed for play at the table; it goes on top of your deck.",
            "It wins any trick it is played in. It has no suit, is always legal, and sets no led suit when led. Two in one trick go to the earliest.",
            "Played, it returns to reserve. Unplayed, it cleans up like any other card.",
            "Between tricks you may give yours to another player, then draw 1. That handover is the only signal allowed."
          ]
        }
      ]
    },
    {
      "id": "rules-2-front",
      "card": "rules-2",
      "side": "2-front",
      "title": "Trick",
      "subtitle": "Table reference · 3 of 4",
      "sections": [
        {
          "heading": "Consolations, on your trick loss",
          "rows": [
            {
              "suit": "strength",
              "label": "Hearts — Brace",
              "text": "On your next play, add or subtract the losing card’s printed value, minimum 0; choose as you play. Braces never stack."
            },
            {
              "suit": "dexterity",
              "label": "Spades — Reposition",
              "text": "Ignore follow-suit on your next play; it counts as unable to follow, so your trump can win."
            },
            {
              "suit": "intelligence",
              "label": "Diamonds — Recalculate",
              "text": "Discard 1 card from hand, then draw 1. If that draw reshuffles your deck, you may evolve."
            },
            {
              "suit": "weird",
              "label": "Clubs — Revelation",
              "text": "Ask the GM one question for a brief true answer, or put a status from discard atop your deck; your next play takes its suit for following, leading, and trump."
            }
          ],
          "note": "Use the losing card’s printed suit, even if an ally won. After the final trick, only Revelation’s question."
        },
        {
          "heading": "Statuses: J, Q, K, value 0",
          "rows": [
            {
              "suit": "strength",
              "label": "Injury — Hearts",
              "text": "Gain only at cleanup or between checks, then scan for survival."
            },
            {
              "suit": "dexterity",
              "label": "Stumble — Spades",
              "text": "If anyone plays it, the world leads the next trick, whoever won."
            },
            {
              "suit": "intelligence",
              "label": "Stress — Diamonds",
              "text": "Each time you draw Stress, gain another into discard, even on redraws and mid-check draws."
            },
            {
              "suit": "weird",
              "label": "Curse — Clubs",
              "text": "Your Curses share one compulsion. Each violation gains 1 Stress per Curse outside reserve. Only evolution removes them."
            }
          ],
          "note": "Gain statuses into discard; if none remain in reserve, gain none."
        }
      ]
    },
    {
      "id": "rules-2-back",
      "card": "rules-2",
      "side": "2-back",
      "title": "Trick",
      "subtitle": "Table reference · 4 of 4",
      "sections": [
        {
          "heading": "Reshuffle, evolution, rest",
          "lines": [
            "When you must draw from an empty deck, you may evolve once, then shuffle discard.",
            "Evolve: return 1 of 2 matching statuses in discard to reserve. Then draw 3 random ordinary reserve cards of that suit and keep 1 in discard, or return 1 ordinary card of that suit to reserve.",
            "Mid-trick, set both statuses aside before shuffling and finish the evolution after the trick.",
            "At a GM-granted rest, remove any number of non-Curse statuses from discard."
          ]
        },
        {
          "heading": "Finish and survive",
          "lines": [
            "A goal succeeds when its score meets its cost. Among incompatible goals, the greatest margin over cost wins; a tie gives the agreed stalemate.",
            "Clean up: shuffle unplayed cards and discard them, discard your played row earliest to latest, then add consequences on top with Injuries last. Never rearrange discard.",
            "Count M Injuries in your top N discard cards. Two or more force survival as your goal, costing M tricks. Failure means death."
          ],
          "note": "Scan at check start with the coming N, and on any Injury gained with the last check’s N — that check follows at once, with no rest."
        }
      ]
    }
  ]
};
