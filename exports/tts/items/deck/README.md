# Trick Item Deck

Files in this folder:
- `trick-item-face-sheet.png`: front card sheet for the full 16-card item deck.
- `trick-item-card-back.png`: shared back image.
- `trick-item-deck-manifest.json`: exact Tabletop Simulator import settings and card order.

Import in Tabletop Simulator:
1. Open `Objects > Components > Custom > Deck`.
2. Set Face to the hosted or local path for `trick-item-face-sheet.png`.
3. Leave `Unique Backs` disabled.
4. Set Back to the hosted or local path for `trick-item-card-back.png`.
5. Set Width to 4, Height to 4, and Number to 16.
6. Leave `Sideways` off and enable `Back is Hidden`.
7. The generated face sheet is 1600x2240.

Card order on the sheet is listed in `trick-item-deck-manifest.json`.
