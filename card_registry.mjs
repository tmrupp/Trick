export const suitCards = [
  { suit: "strength", file: "strength.html", statusName: "injury", statusFile: "injury.html" },
  { suit: "dexterity", file: "dexterity.html", statusName: "dazed", statusFile: "dazed.html" },
  { suit: "intelligence", file: "intelligence.html", statusName: "stress", statusFile: "stress.html" },
  { suit: "weird", file: "weird.html", statusName: "curse", statusFile: "curse.html" },
//   { suit: "divine", file: "divine.html", statusName: "blessed", statusFile: "blessed.html" }
];

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildDeckCards() {
  return suitCards.flatMap(({ suit, file, statusName, statusFile }) => {
    const numberedCards = Array.from({ length: 10 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      label: `${capitalize(suit)} ${index + 1}`,
      file,
      params: { value: index + 1 }
    }));

    return [
      ...numberedCards,
      {
        id: statusName,
        label: capitalize(statusName),
        file: statusFile,
        params: {}
      }
    ];
  });
}