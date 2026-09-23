# Trick Tabletop Simulator Deck

Current rules: [RULES.md](../../../RULES.md). Player guide: [PLAYER_GUIDE.md](../../../PLAYER_GUIDE.md).
This is one 54-card standard-deck equivalent: A–10 in each suit, J/Q/K represented by identical zero-value status cards, and two jokers as Blessed cards. Import or duplicate it twice per player for 80 ordinary cards, 24 statuses, and 4 Blessed. From one copy, take 2, 4, 6, 8 of every suit, add A, 5, 9 of your primary suit, and add 3, 7 of a different secondary suit. This gives a 21-card starter distributed 7/6/4/4. The remaining cards and the entire second copy form reserve. All four Blessed start in reserve. The GM uses only A–10 from a separate copy.

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
