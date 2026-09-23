# Trick Tabletop Simulator Deck

Rules: [RULES.md](../../../RULES.md), the single source.
This is one 54-card standard-deck equivalent: A–10 in each suit, J/Q/K represented by identical zero-value status cards, and two jokers as Blessed cards. Import or duplicate it twice per player for 80 ordinary cards, 24 statuses, and 4 Blessed. Build each starting deck and reserve as in RULES.md, Decks and suits.

Files in this folder:
- `trick-face-sheet.png`: front card sheet for the full 54-card deck.
- `trick-card-back.png`: shared back image.
- `trick-custom-deck-manifest.json`: exact Tabletop Simulator import settings and card order.

Import in Tabletop Simulator:
1. Open `Objects > Components > Custom > Deck`.
2. Set Face to the hosted or local path for `trick-face-sheet.png`.
3. Leave `Unique Backs` disabled.
4. Set Back to the hosted or local path for `trick-card-back.png`.
5. Set Width to 10, Height to 6, and Number to 54.
6. Leave `Sideways` off and enable `Back is Hidden`.
7. The generated face sheet is 4000x3360, sized to stay within TTS image guidance.

Card order on the sheet is listed in `trick-custom-deck-manifest.json`.
