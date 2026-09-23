// Suit and item marks, stroked in currentColor. The standalone .svg files carry the same paths in suit ink.
(function () {
  const SUITS = {
    strength: {
      name: "Strength",
      ink: "#7a1f16",
      paths: '<line x1="36" y1="10" x2="36" y2="90" /><path d="M 36 22 L 52 22 C 60 22 66 16 72 10 C 88 22 92 48 80 66 C 72 58 62 50 52 50 L 36 50" />'
    },
    dexterity: {
      name: "Dexterity",
      ink: "#1f5e2d",
      paths: '<path d="M 28 10 L 60 10 L 58 48 C 60 54 68 57 78 59 C 88 61 92 68 92 76 L 92 84 L 50 84 L 46 76 L 38 76 L 34 84 L 28 84 Z" /><line x1="29" y1="22" x2="59" y2="22" />'
    },
    intelligence: {
      name: "Intelligence",
      ink: "#1f4072",
      paths: '<path d="M 15 25 C 25 25 40 35 50 40 L 50 90 C 40 85 25 75 15 75 Z" /><path d="M 85 25 C 75 25 60 35 50 40 L 50 90 C 60 85 75 75 85 75 Z" />'
    },
    weird: {
      name: "Weird",
      ink: "#4f2a73",
      paths: '<path d="M 65 15 A 35 35 0 1 0 65 85 A 45 45 0 0 1 65 15 Z" />'
    }
  };

  // Blessed has no suit, but its mark and ink sit with the suits' so cards look it up the same way.
  SUITS.blessed = {
    name: "Blessed",
    ink: "#80601a",
    paths: '<path d="M 50 8 C 54 36 64 46 92 50 C 64 54 54 64 50 92 C 46 64 36 54 8 50 C 36 46 46 36 50 8 Z" />'
  };

  const ITEM_MARKS = {
    trinket: '<path d="M 22 10 C 28 26 40 32 50 32 C 60 32 72 26 78 10" /><path d="M 50 40 C 70 58 72 84 50 91 C 28 84 30 58 50 40 Z" /><line x1="50" y1="32" x2="50" y2="40" />',
    relic: '<path d="M 16 74 L 16 30 L 34 50 L 50 20 L 66 50 L 84 30 L 84 74 Z" /><line x1="16" y1="62" x2="84" y2="62" />'
  };

  function svg(name, label) {
    const paths = SUITS[name] ? SUITS[name].paths : ITEM_MARKS[name];
    if (!paths) {
      throw new Error(`Unknown icon: ${name}`);
    }
    const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
    return `<svg viewBox="0 0 100 100" ${a11y}><g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
  }

  globalThis.TrickSuitIcons = { suits: SUITS, svg };
}());
