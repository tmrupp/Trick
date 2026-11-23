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
            "Standard: 3 tricks per player, +1, target 6–28 (default 12). Quick: 2 per player, +1, target 6–17 (default 10). Solo: 6 tricks, target 6–20 (default 12).",
            "Deal the world one card per trick, face up in a row. Everyone draws the same number."
          ],
          "note": "Standard target 6–10 easy · 11–13 moderate · 14–16 hard · 17–19 very hard · 20–22 extreme · 23–25 heroic · 26–28 legendary."
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
            "Losers take consolations at once. Winning isn't optional; if you bust, sit out.",
            "A player won? The world's consolation, on its next card: ♥ +taken value to beat, ♠ scores 1 less, ♦ swap from the world deck, ♣ 11 minus."
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
              "label": "Spades — Shave",
              "text": "Your next card, if it wins, scores 1 less, never below 0."
            },
            {
              "suit": "intelligence",
              "label": "Diamonds — Recalculate",
              "text": "Draw 1 card."
            },
            {
              "suit": "weird",
              "label": "Clubs — Mirror",
              "text": "Your next card counts 11 minus its value for beating (a 2 counts 9). Scores don’t change; statuses stay 0."
            }
          ],
          "note": "Use the losing card’s printed suit, even if an ally won. They happen by themselves. Brace, Shave and Mirror last one play. No consolations after the final trick."
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
              "text": "Once played, it goes on top of your deck at cleanup: you draw it first next check."
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
            "Clean up: return world cards, discard unplayed cards, then your played row (played Stumbles on top of your deck), then consequences with Injuries last."
          ]
        },
        {
          "heading": "Reshuffle, evolve, survive",
          "lines": [
            "On an empty deck you may evolve once: return 1 of 2 matching statuses in discard to reserve, then gain or return an ordinary card of that suit. Shuffle discard.",
            "Rest removes any number of non-Curse statuses from discard.",
            "M Injuries in your top N discard cards, M ≥ 2: survival is your goal, target 3 × M + 3. A bust or 7+ short means death."
          ],
          "note": "N is the check’s number of tricks."
        }
      ]
    }
  ]
};
