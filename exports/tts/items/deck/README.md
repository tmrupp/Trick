# Trick Item Deck

Files in this folder:
- `trick-item-face-sheet.png`: front card sheet for the full 14-card item deck.
- `trick-item-back-sheet.png`: back card sheet with shared trinket backs and relic-price backs.
- `trick-item-deck-manifest.json`: exact Tabletop Simulator import settings and card order.

Import in Tabletop Simulator:
1. Open `Objects > Components > Custom > Deck`.
2. Set Face to the hosted or local path for `trick-item-face-sheet.png`.
3. Enable `Unique Backs`.
4. Set Back to the hosted or local path for `trick-item-back-sheet.png`.
5. Set Width to 4, Height to 4, and Number to 14.
6. Leave `Sideways` off and enable `Back is Hidden`.
7. The generated face sheet is 1600x2240.

Card order on the sheet is listed in `trick-item-deck-manifest.json`.
