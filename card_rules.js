// Shared current card copy. RULES.md is the full rules reference.
globalThis.TrickCoreCards = {
  strength: {
    suitLabel: "Spades — Strength", domain: "Spades / Consolation", title: "BRACE",
    lines: ["On a trick loss, you may add or subtract this card's printed value from your next play, minimum 0. Choose when committing, before reveal. A status modifies by 0.", "Keep this card in your played row until cleanup. Skip after the final trick; the effect expires at check end."],
    description: "Add or subtract the losing card's printed value from your next play, minimum 0. Keep it in the played row until cleanup."
  },
  dexterity: {
    suitLabel: "Clubs — Dexterity", domain: "Clubs / Consolation", title: "REPOSITION",
    lines: ["On a trick loss, you may ignore follow-suit on your next play. Normal winning rules still apply.", "Skip after the final trick. Expires after your next play or at check end."],
    description: "You may ignore follow-suit on your next play."
  },
  intelligence: {
    suitLabel: "Diamonds — Intelligence", domain: "Diamonds / Consolation", title: "RECALCULATE",
    lines: ["On a trick loss, discard one card from hand, including a status, then draw one. You need a card to discard.", "If that draw reshuffles your deck, you may evolve first. Skip after the final trick."],
    description: "Discard one card from hand, then draw one. A reshuffle from that draw allows evolution."
  },
  weird: {
    suitLabel: "Hearts — Weird", domain: "Hearts / Consolation", title: "REVELATION",
    lines: ["On a trick loss, choose: ask the GM one question for a brief truthful answer; or put a status from discard atop your deck. Your next card takes that suit instead of its own.", "Use the replacement suit for follow-suit, leading, and trump. After the final trick, only the question is available."],
    description: "Ask a truthful question, or replace your next play's suit with a discarded status's suit and put that status atop your deck."
  },
  injury: {
    suitLabel: "Spades — Injury", domain: "Spades / Status", title: "INJURY",
    lines: ["Gain Injuries only at cleanup or between checks. Count Injuries in your top N discard cards at check start and whenever you gain one. Other changes wait for the next start scan.", "Two or more force your goal to survival: win that many tricks yourself or die. A gain-triggered survival check begins immediately, without rest."],
    description: "Two or more Injuries in the top N discard cards force your goal to survival. Only your wins count. Scan at check start and whenever an Injury is gained."
  },
  dazed: {
    suitLabel: "Clubs — Stumble", domain: "Clubs / Status", title: "STUMBLE",
    lines: ["If anyone plays Stumble, the world leads the next trick, regardless of who won. Multiple Stumbles have the same effect as one.", "Follow normal play and scoring rules. Keep this card in your played row until cleanup, even on a win."],
    description: "The world leads the next trick if anyone plays Stumble, regardless of who won."
  },
  stress: {
    suitLabel: "Diamonds — Stress", domain: "Diamonds / Status", title: "STRESS",
    lines: ["Whenever you draw Stress, gain one Stress from reserve into discard, if available. This includes redraws and draws during play.", "Gaining Stress into discard is not drawing it. All face-card ranks of this suit are identical zero-value statuses."],
    description: "Every draw of Stress adds another from reserve to discard, including redraws and mid-check draws."
  },
  curse: {
    suitLabel: "Hearts — Curse", domain: "Hearts / Status", title: "CURSE",
    lines: ["Your Curses share one supernatural compulsion, recorded with your first Curse. Each violation gains one Stress per Curse outside reserve.", "Count six minus the Curses in reserve. Remove Curses through evolution, never rest. Removing the last ends the compulsion."],
    description: "Curses share a compulsion. Each violation gains one Stress per Curse outside reserve. Remove through evolution, never rest."
  },
  blessed: {
    suitLabel: "Joker — Blessed", domain: "Joker / Blessed", title: "BLESSED",
    lines: ["Wins any trick it is played in, beating trump. It has no suit: it never follows suit and is always legal. Leading it sets no led suit. If two meet, the earliest wins.", "A played Blessed returns to reserve. Unplayed, it cleans up like an ordinary card. Between tricks you may give it to another player, then draw one; no advice goes with it."],
    description: "Wins any trick it is played in. No suit, always legal, and returns to reserve once played. Granted by the GM for play at the table."
  }
};
