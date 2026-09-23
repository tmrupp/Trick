export const suitCards = [
  { suit: "strength", standardSuit: "Hearts", file: "strength.html", statusName: "injury", statusFile: "injury.html" },
  { suit: "dexterity", standardSuit: "Spades", file: "dexterity.html", statusName: "dazed", statusLabel: "Stumble", statusFile: "dazed.html" },
  { suit: "intelligence", standardSuit: "Diamonds", file: "intelligence.html", statusName: "stress", statusFile: "stress.html" },
  { suit: "weird", standardSuit: "Clubs", file: "weird.html", statusName: "curse", statusFile: "curse.html" }
];

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Each standard-deck copy carries two jokers, which Trick uses as Blessed cards.
export const blessedCards = [1, 2].map(copy => ({
  id: `blessed-${copy}`,
  label: "Joker — Blessed",
  file: "blessed.html",
  params: {}
}));

export function buildDeckCards() {
  return [...suitCards.flatMap(({ suit, standardSuit, file, statusName, statusLabel, statusFile }) => {
    const numberedCards = Array.from({ length: 10 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      label: `${index === 0 ? "Ace" : index + 1} of ${standardSuit} — ${capitalize(suit)}`,
      file,
      params: { value: index + 1 }
    }));

    return [
      ...numberedCards,
      ...["J", "Q", "K"].map(rank => ({
        id: `${statusName}-${rank.toLowerCase()}`,
        label: `${rank} of ${standardSuit} — ${statusLabel || capitalize(statusName)} (0)`,
        file: statusFile,
        params: {}
      }))
    ];
  }), ...blessedCards];
}
