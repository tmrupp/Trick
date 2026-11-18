// Text for the rules reference cards: the one hand-written summary of RULES.md.
// RULES.md is the single source; update these cards whenever a rule there changes.
// Two cards, four sides, printed at a readable size. A row's suit prints its label in that suit's ink.
globalThis.TrickRulesCard = {
  "sides": [
    {
      "id": "rules-1-front",
      "card": "rules-1",
      "side": "1-front",
      "title": "TRICK",
      "subtitle": "Tally checks · 1 of 4",
      "sections": [
        {
          "heading": "Set the check",
          "lines": [
            "Scan every discard for survival before drawing or reshuffling.",
            "Each player states a goal: what they do and how. The suit it leans on is their trump for the check.",
            "The GM sets each goal's target (the player may suggest one) and has final say on its suit. Agree stakes.",
            "An immediate threat can force your goal; you still choose how, and so its suit.",
            "Standard: 3 tricks per player, +1, target 6–20 (default 10). Quick: 2 per player, +1, target 6–12 (default 6). Solo: 6 tricks.",
            "Deal the world one card per trick, face up in a row. Everyone draws the same number."
          ],
          "note": "Target 6–8 easy · 9–11 moderate · 12–14 hard · 15–17 very hard · 18–20 extreme."
        }
      ]
    },
    {
      "id": "rules-1-back",
      "card": "rules-1",
      "side": "1-back",
      "title": "TRICK",
      "subtitle": "Tally checks · 2 of 4",
      "sections": [
        {
          "heading": "Every trick",
          "lines": [
            "The world leads its next card. Everyone chooses a card face down, then all reveal together.",
            "The single highest card on the table wins if it is a player's, in the world card's suit or its owner's trump. Count Brace.",
            "The winner scores the world card's value, not their own card's.",
            "Tied players: world card's suit and own trump beats world card's suit only, which beats trump only. Otherwise the world takes it: the world card is highest, the top card is off-suit, or the tie stays level.",
            "Everyone else takes their card's consolation, all at once. Winning is not optional."
          ],
          "note": "Once drawing begins: no tactical talk, card advice, or signals. Narration, rules questions, and declarations are welcome."
        },
        {
          "heading": "Blessed, your four jokers",
          "lines": [
            "The GM grants a Blessed for play at the table; it goes on top of your deck.",
            "It always takes its trick and scores the world card. It has no suit. Two Blessed tie: the world takes it.",
            "Played, it returns to reserve. Between tricks you may give yours to another player, then draw 1."
          ]
        }
      ]
    },
    {
      "id": "rules-2-front",
      "card": "rules-2",
      "side": "2-front",
      "title": "TRICK",
      "subtitle": "Tally checks · 3 of 4",
      "sections": [
        {
          "heading": "Consolations, on your trick loss",
          "rows": [
            {
              "suit": "strength",
              "label": "Hearts — Brace",
              "text": "Your next card counts this card’s printed value higher for beating. It never changes what you score."
            },
            {
              "suit": "dexterity",
              "label": "Spades — Peek",
              "text": "Replace the next world card, unseen, from the world deck’s top; the old one goes to the bottom. Once a trick."
            },
            {
              "suit": "intelligence",
              "label": "Diamonds — Recalculate",
              "text": "Discard 1 card from hand, then draw 1."
            },
            {
              "suit": "weird",
              "label": "Clubs — Mirror",
              "text": "If your next card wins, the world card scores 11 minus its value."
            }
          ],
          "note": "Use the losing card’s printed suit, even if an ally won. No consolations after the final trick."
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
              "text": "When you play it, discard an ordinary card from hand."
            },
            {
              "suit": "intelligence",
              "label": "Stress — Diamonds",
              "text": "Each time you draw Stress, gain another into discard."
            },
            {
              "suit": "weird",
              "label": "Curse — Clubs",
              "text": "Your Curses share one compulsion. Each violation gains 1 Stress per Curse outside reserve. Only evolution removes them."
            }
          ],
          "note": "Statuses play like cards worth 0 and give their suit’s consolation. Hold one in the world card’s suit? You must play it."
        }
      ]
    },
    {
      "id": "rules-2-back",
      "card": "rules-2",
      "side": "2-back",
      "title": "TRICK",
      "subtitle": "Tally checks · 4 of 4",
      "sections": [
        {
          "heading": "Resolve against the target",
          "lines": [
            "Exact: critical success, plus a benefit from the fiction. 1–3 short: success, minor complication. 4–6 short: partial, serious complication. 7+ short: failure. Over: bust, a loud consequence from the fiction.",
            "Incompatible goals: the better result wins, then the tally closer to its target.",
            "Clean up: return world cards, discard unplayed cards, then your played row, then consequences with Injuries last."
          ]
        },
        {
          "heading": "Reshuffle, evolve, survive",
          "lines": [
            "On an empty deck you may evolve once: return 1 of 2 matching statuses in discard to reserve, then gain or return an ordinary card of that suit. Shuffle discard.",
            "Rest removes any number of non-Curse statuses from discard.",
            "M Injuries in your top N discard cards, M ≥ 2: survival is your goal, target 3 × M. A bust or 7+ short means death."
          ],
          "note": "N is the check’s number of tricks."
        }
      ]
    }
  ]
};
