# Trick Tabletop Simulator Deck

Files in this folder:
- `trick-face-sheet.png`: front card sheet for the full 44-card deck.
- `trick-card-back.png`: shared back image.
- `trick-custom-deck-manifest.json`: exact Tabletop Simulator import settings and card order.

Import in Tabletop Simulator:
1. Open `Objects > Components > Custom > Deck`.
2. Set Face to the hosted or local path for `trick-face-sheet.png`.
3. Leave `Unique Backs` disabled.
4. Set Back to the hosted or local path for `trick-card-back.png`.
5. Set Width to 10, Height to 5, and Number to 44.
6. Leave `Sideways` off and enable `Back is Hidden`.
7. The generated face sheet is 4000x2800, sized to stay within TTS image guidance.

Card order on the sheet is listed in `trick-custom-deck-manifest.json`.
