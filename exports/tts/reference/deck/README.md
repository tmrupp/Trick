# Trick Reference Deck

Handout cards for the current [rules](../../../../RULES.md): one card per optional people and one
double-sided rules card. Read [peoples conventions](../../../../races/README.md) before use. This deck
is separate from the two standard decks per player, and none of it is needed for core play.

Files in this folder:
- `trick-reference-face-sheet.png`: front card sheet for the full 7-card reference deck.
- `trick-reference-back-sheet.png`: back card sheet, the shared timing card behind each people and the rules card's second side.
- `trick-reference-deck-manifest.json`: exact Tabletop Simulator import settings and card order.

Import in Tabletop Simulator:
1. Open `Objects > Components > Custom > Deck`.
2. Set Face to the hosted or local path for `trick-reference-face-sheet.png`.
3. Enable `Unique Backs`.
4. Set Back to the hosted or local path for `trick-reference-back-sheet.png`.
5. Set Width to 4, Height to 2, and Number to 7.
6. Leave `Sideways` off and leave `Back is Hidden` off, so players can flip a card to read its back.
7. The generated face sheet is 1600x1120.

Every people's card carries the `shared-timing` card on its back, so the timing every ability obeys is always one flip away.
Deal one people's card to each player and leave the rules card on the table.

## Printing

The full-size images in `../fronts` and `../back` are 1050x1470, the deck's 1:1.4 ratio.
At 300 dpi that is 3.5 x 4.9 in. Print the rules card at that size or larger, since it carries the densest text in the set.

- Varn
- Moon-Eyed
- Tarrans
- Hollow-Skinned
- Rootborn
- Ashcrik
- Rules Reference, front and back

Card order on the sheet is listed in `trick-reference-deck-manifest.json`.
