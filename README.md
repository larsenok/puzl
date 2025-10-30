# Puzl

This repository contains **Star Orchard**, a phone-friendly React Native puzzle built with Expo. Players are given a single 5×5 orchard at a time and must place apples so every row and column matches the provided clue counts.

## Game summary

- Each puzzle is randomly generated when the app launches or when "New Puzzle" is pressed.
- Tap a plot to cycle through empty ground, an apple (🍎), and a marker (✕) for notes.
- Row and column hints update live and change colour when satisfied or exceeded, guiding progress without revealing the solution outright.
- The "Check Solution" button verifies every plot against the hidden orchard layout, while "Clear Board" resets the current attempt without changing the underlying puzzle.

## Project structure

- `App.js` hosts the full Star Orchard experience including puzzle generation, interaction logic, and responsive styling for small screens.
- `app.json`, `babel.config.js`, and `package.json` configure the Expo React Native project for Android, iOS, and web targets.

## Why this approach?

- **Expo & React Native** were chosen for rapid setup and built-in mobile optimisations, ensuring the layout scales gracefully on phones while still supporting web previews.
- **Randomised puzzles with deterministic clues** keep gameplay fresh but fair. By exposing only row/column counts and colour-coded feedback, players always have a solvable logical challenge without guesswork.
- **Minimal dependencies** beyond Expo’s core stack keep the project lightweight and easy to install or extend.

To run the project locally, install dependencies with `npm install` and start with `npm run start` (or the platform-specific scripts defined in `package.json`).


## Deployment

- Run `npm run build` to generate a static web bundle in the `dist/` folder.
- Deploy the repository to Vercel using the default Node.js settings; the included `vercel.json` configures the build command and output directory for you.
