# Puzl

Puzl is a static logic puzzle built with plain HTML, CSS, and JavaScript. Boards range from 4×4 to
8×8 and support four difficulties, including an unlockable Extreme mode.

## Features

- Daily seeds stored locally so the current board persists across sessions.
- Local and global leaderboards that track solve time and difficulty.
- Zero-runtime build script that outputs static assets for any CDN or host.

## Gameplay

Each puzzle divides the grid into regions with target apple counts, plus row and column totals.
Click or tap to toggle a cell through empty soil, apple, and note states. Row and column hints turn
green when satisfied and red when exceeded.

## Project structure

- `src/index.html` – static markup served by the host.
- `src/styles.css` – board layout, hints, and controls.
- `src/main.js` – puzzle generation, interactions, scoring, and leaderboards.
- `build.js` – copies `src/` to `dist/` for deployment.
