# Overnight: when the world takes a trick, and Stumble's Price

Generated 2026-11-21T07:35:56.585Z by an overnight run of scripts/simulate_tally.mjs (Parts 3h and 3i). Greedy bots: 20,000 checks a cell. Look-ahead bots: 2,000 a cell.

## Look-ahead bots (players who plan)

### World-take effects

Success or better / exact / bust (%), and in brackets the change in success and exact against none.

| Effect | 3 players | 3 players hard | 2 players | quick 3 players |
| --- | --- | --- | --- | --- |
| none | 95 / 67 / 0 | 80 / 46 / 0 | 91 / 53 / 0 | 82 / 45 / 0 |
| consolations | 93 / 58 / 1 (-2 / -9) | 74 / 39 / 0 (-6 / -7) | 88 / 45 / 0 (-3 / -8) | 76 / 39 / 0 (-6 / -6) |
| wbrace | 94 / 64 / 1 (-1 / -3) | 77 / 42 / 0 (-3 / -4) | 89 / 50 / 0 (-2 / -3) | 79 / 42 / 0 (-3 / -3) |
| wshave | 95 / 64 / 1 (0 / -3) | 78 / 44 / 0 (-2 / -2) | 89 / 50 / 0 (-2 / -3) | 80 / 44 / 0 (-2 / -1) |
| wnotrump | 96 / 66 / 0 (+1 / -1) | 80 / 46 / 0 (0 / 0) | 90 / 51 / 0 (-1 / -2) | 80 / 44 / 0 (-2 / -1) |
| wmirror | 95 / 66 / 1 (0 / -1) | 80 / 46 / 0 (0 / 0) | 91 / 53 / 0 (0 / 0) | 80 / 45 / 0 (-2 / 0) |
| harden | 94 / 64 / 1 (-1 / -3) | 77 / 43 / 0 (-3 / -3) | 85 / 48 / 0 (-6 / -5) | 79 / 43 / 0 (-3 / -2) |
| relief | 95 / 67 / 1 (0 / 0) | 81 / 47 / 1 (+1 / +1) | 92 / 55 / 0 (+1 / +2) | 80 / 45 / 0 (-2 / 0) |
| momentum | 94 / 64 / 1 (-1 / -3) | 78 / 43 / 0 (-2 / -3) | 88 / 50 / 0 (-3 / -3) | 80 / 43 / 0 (-2 / -2) |
| drawall | 97 / 77 / 1 (+2 / +10) | 84 / 54 / 1 (+4 / +8) | 95 / 67 / 0 (+4 / +14) | 85 / 53 / 0 (+3 / +8) |
| brace2 | 96 / 67 / 1 (+1 / 0) | 80 / 45 / 0 (0 / -1) | 92 / 55 / 0 (+1 / +2) | 80 / 45 / 0 (-2 / 0) |
| shared | 95 / 68 / 1 (0 / +1) | 80 / 46 / 0 (0 / 0) | 93 / 55 / 0 (+2 / +2) | 81 / 44 / 0 (-1 / -1) |
| rollover | 72 / 35 / 10 (-23 / -32) | 67 / 33 / 5 (-13 / -13) | 58 / 25 / 5 (-33 / -28) | 26 / 12 / 2 (-56 / -33) |

### Stumble's Price

Success or better / exact / bust (%), and in brackets the change in success and exact against price.

| Effect | worn 3 players | worn 3 players hard |
| --- | --- | --- |
| price | 92 / 59 / 0 | 72 / 38 / 0 |
| highest | 91 / 57 / 1 (-1 / -2) | 70 / 37 / 0 (-2 / -1) |
| random | 92 / 58 / 0 (0 / -1) | 72 / 36 / 0 (0 / -2) |
| deck | 94 / 63 / 0 (+2 / +4) | 75 / 42 / 0 (+3 / +4) |
| none | 94 / 64 / 0 (+2 / +5) | 75 / 42 / 0 (+3 / +4) |

## Greedy bots (the difficulty table's bots)

### World-take effects

Success or better / exact / bust (%), and in brackets the change in success and exact against none.

| Effect | 3 players | 3 players hard | 2 players | quick 3 players |
| --- | --- | --- | --- | --- |
| none | 63 / 18 / 7 | 40 / 11 / 3 | 53 / 14 / 7 | 53 / 17 / 8 |
| consolations | 60 / 17 / 5 (-3 / -1) | 36 / 9 / 3 (-4 / -2) | 49 / 12 / 6 (-4 / -2) | 49 / 15 / 7 (-4 / -2) |
| wbrace | 60 / 17 / 6 (-3 / -1) | 37 / 10 / 3 (-3 / -1) | 50 / 13 / 6 (-3 / -1) | 50 / 16 / 7 (-3 / -1) |
| wshave | 62 / 18 / 6 (-1 / 0) | 40 / 11 / 3 (0 / 0) | 53 / 14 / 6 (0 / 0) | 53 / 17 / 7 (0 / 0) |
| wnotrump | 63 / 18 / 6 (0 / 0) | 40 / 11 / 3 (0 / 0) | 52 / 13 / 7 (-1 / -1) | 52 / 17 / 7 (-1 / 0) |
| wmirror | 63 / 18 / 7 (0 / 0) | 41 / 11 / 3 (+1 / 0) | 53 / 14 / 8 (0 / 0) | 52 / 17 / 8 (-1 / 0) |
| harden | 59 / 17 / 5 (-4 / -1) | 37 / 10 / 2 (-3 / -1) | 49 / 13 / 5 (-4 / -1) | 52 / 16 / 7 (-1 / -1) |
| relief | 64 / 19 / 8 (+1 / +1) | 43 / 12 / 3 (+3 / +1) | 55 / 15 / 9 (+2 / +1) | 53 / 17 / 8 (0 / 0) |
| momentum | 60 / 17 / 5 (-3 / -1) | 37 / 10 / 2 (-3 / -1) | 50 / 13 / 6 (-3 / -1) | 53 / 16 / 7 (0 / -1) |
| drawall | 75 / 23 / 1 (+12 / +5) | 50 / 14 / 0 (+10 / +3) | 67 / 19 / 1 (+14 / +5) | 66 / 22 / 1 (+13 / +5) |
| brace2 | 64 / 18 / 7 (+1 / 0) | 42 / 12 / 3 (+2 / +1) | 55 / 15 / 9 (+2 / +1) | 53 / 17 / 8 (0 / 0) |
| shared | 67 / 20 / 4 (+4 / +2) | 43 / 12 / 2 (+3 / +1) | 57 / 15 / 5 (+4 / +1) | 57 / 18 / 5 (+4 / +1) |
| rollover | 34 / 8 / 16 (-29 / -10) | 26 / 7 / 12 (-14 / -4) | 32 / 7 / 16 (-21 / -7) | 22 / 7 / 19 (-31 / -10) |

### Stumble's Price

Success or better / exact / bust (%), and in brackets the change in success and exact against price.

| Effect | worn 3 players | worn 3 players hard |
| --- | --- | --- |
| price | 59 / 16 / 7 | 36 / 9 / 3 |
| highest | 58 / 15 / 6 (-1 / -1) | 35 / 9 / 3 (-1 / 0) |
| random | 59 / 16 / 7 (0 / 0) | 36 / 10 / 3 (0 / +1) |
| deck | 62 / 17 / 5 (+3 / +1) | 38 / 10 / 2 (+2 / +1) |
| none | 62 / 17 / 5 (+3 / +1) | 39 / 10 / 2 (+3 / +1) |
