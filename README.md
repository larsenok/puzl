# Puzl

Star Orchard is a bite-sized logic puzzle rendered with plain HTML, CSS, and vanilla JavaScript.
Fill the 5×5 orchard with apples so every row and column matches the clue counts.
Tap (or click) a plot to cycle through empty ground, an apple, and a marker for notes.

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
