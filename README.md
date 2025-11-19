# Puzl

Star Orchard is a bite-sized logic puzzle rendered with plain HTML, CSS, and vanilla JavaScript.
Boards range from compact 4×4 orchards to sprawling 8×8 estates depending on the chosen difficulty.

## Status

- ✅ Fully playable across four difficulties with unlockable Extreme mode.
- ✅ Daily seeds stored locally so players can revisit a board later the same day.
- ✅ Zero-runtime build that ships static assets ready for any CDN or static host.

## How the game works

Each puzzle presents an orchard divided into irregular regions. Every region has a badge
showing how many apples it must contain. Rows and columns list their own apple totals as well.

Click or tap a cell to cycle through empty soil, an apple, and a note marker. When a row or
column matches its total exactly the clue turns green; exceeding the total turns it red. Use the
logic of overlapping constraints to ensure each region hits its requirement while the rows and
columns all satisfy their totals.

## Scoring

Every finished board records the chosen difficulty and the total time it took to solve. Those two
values are enough for the game to determine a final score: faster solves give more points, slower
runs still earn credit, and tougher difficulties multiply the result. Extreme mode adds a small
bonus on top so leaderboard chasers have a little extra incentive to brave the hardest boards.

## Project structure

- `src/index.html` contains the static markup that Vercel serves.
- `src/styles.css` styles the board, hints, and controls.
- `src/main.js` handles puzzle generation, interactions, and win detection.
- `build.js` copies everything in `src/` to `dist/` during the build step.

## Local development

No dependencies are required. To produce a deployable bundle run:

```bash
npm run build
```

The static assets will be emitted to `dist/` and can be served by any static host.

## Gameplay highlights

- Every puzzle is generated on the fly but always solvable by logic.
- Row and column clues update immediately and change colour when satisfied or exceeded.
- "Check Solution" validates the whole board, "Clear Board" resets the attempt, and "New Puzzle" generates a fresh orchard.
