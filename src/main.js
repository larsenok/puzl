const PUZZLE_LIBRARY = [
  {
    size: 4,
    weight: 1,
    overlays: [
      [
        [0, 0, 1, 1],
        [0, 2, 2, 1],
        [3, 2, 4, 4],
        [3, 5, 5, 4]
      ],
      [
        [0, 0, 1, 1],
        [2, 0, 1, 3],
        [2, 4, 3, 3],
        [5, 4, 6, 6]
      ],
      [
        [0, 1, 1, 2],
        [0, 3, 4, 2],
        [5, 3, 4, 6],
        [5, 7, 6, 6]
      ]
    ]
  },
  {
    size: 5,
    weight: 2,
    overlays: [
      [
        [0, 0, 0, 1, 1],
        [2, 3, 0, 1, 4],
        [2, 3, 3, 4, 4],
        [5, 5, 6, 6, 7],
        [8, 5, 9, 7, 7]
      ],
      [
        [0, 0, 1, 1, 1],
        [2, 0, 3, 4, 4],
        [2, 3, 3, 5, 4],
        [6, 6, 5, 5, 7],
        [8, 6, 9, 7, 7]
      ],
      [
        [0, 0, 1, 1, 2],
        [3, 0, 1, 4, 2],
        [3, 5, 4, 4, 2],
        [6, 5, 5, 7, 7],
        [6, 8, 8, 8, 9]
      ]
    ]
  },
  {
    size: 6,
    weight: 4,
    overlays: [
      [
        [0, 0, 1, 1, 2, 2],
        [0, 3, 3, 1, 4, 2],
        [5, 3, 6, 4, 4, 2],
        [5, 6, 6, 7, 8, 8],
        [9, 9, 6, 7, 10, 8],
        [9, 11, 11, 7, 10, 10]
      ],
      [
        [0, 0, 1, 1, 2, 2],
        [3, 0, 1, 4, 4, 2],
        [3, 5, 5, 4, 6, 6],
        [7, 7, 5, 8, 8, 6],
        [7, 9, 9, 10, 8, 11],
        [12, 9, 10, 10, 11, 11]
      ],
      [
        [0, 0, 1, 1, 2, 2],
        [3, 0, 4, 4, 2, 5],
        [3, 6, 6, 4, 7, 5],
        [8, 6, 9, 9, 7, 5],
        [8, 10, 10, 11, 7, 12],
        [13, 10, 11, 11, 12, 12]
      ]
    ]
  },
  {
    size: 7,
    weight: 6,
    overlays: [
      [
        [0, 0, 1, 1, 2, 2, 2],
        [0, 3, 3, 1, 4, 5, 2],
        [6, 3, 7, 4, 4, 5, 8],
        [6, 7, 7, 9, 10, 5, 8],
        [11, 11, 9, 9, 10, 12, 12],
        [13, 14, 14, 15, 10, 15, 12],
        [13, 16, 16, 15, 17, 17, 12]
      ],
      [
        [0, 0, 1, 1, 1, 2, 2],
        [3, 0, 4, 5, 1, 6, 2],
        [3, 4, 4, 5, 7, 6, 8],
        [9, 9, 10, 5, 7, 6, 8],
        [11, 12, 10, 13, 7, 14, 8],
        [11, 12, 15, 13, 16, 14, 8],
        [17, 12, 15, 13, 16, 18, 18]
      ],
      [
        [0, 0, 1, 1, 2, 2, 3],
        [4, 0, 5, 6, 2, 7, 3],
        [4, 5, 5, 6, 7, 7, 3],
        [8, 9, 9, 6, 10, 7, 11],
        [8, 12, 9, 10, 10, 13, 11],
        [14, 12, 15, 16, 13, 13, 11],
        [14, 12, 15, 16, 17, 17, 18]
      ]
    ]
  }
];

const DIFFICULTIES = {
  easy: {
    label: 'Easy',
    allowedSizes: [4],
    requirement: { min: 1, max: 2 }
  },
  normal: {
    label: 'Normal',
    allowedSizes: [5],
    requirement: { min: 1, max: 3 }
  },
  hard: {
    label: 'Hard',
    allowedSizes: [6],
    requirement: { min: 2, max: 4 }
  },
  xtrem: {
    label: 'Xtrem',
    allowedSizes: [7],
    requirement: { min: 3, max: 5 }
  }
};

const DEFAULT_DIFFICULTY = 'normal';

const REGION_COLORS = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#84cc16',
  '#10b981',
  '#38bdf8'
];

const CELL_STATES = ['empty', 'fruit', 'mark'];

const createEmptyBoard = (size) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty'));

const shuffleArray = (input) => {
  const array = [...input];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
};

const getDifficultySettings = (difficulty) =>
  DIFFICULTIES[difficulty] || DIFFICULTIES[DEFAULT_DIFFICULTY];

const chooseConfig = (difficulty) => {
  const settings = getDifficultySettings(difficulty);
  const pool = PUZZLE_LIBRARY.filter((config) =>
    !settings.allowedSizes || settings.allowedSizes.includes(config.size)
  );

  const library = pool.length > 0 ? pool : PUZZLE_LIBRARY;

  const weighted = library.flatMap((config) =>
    Array.from({ length: config.weight }, () => config)
  );
  const choice = weighted[Math.floor(Math.random() * weighted.length)];
  return choice;
};

const createPuzzle = (difficulty, attempt = 0) => {
  const settings = getDifficultySettings(difficulty);
  const config = chooseConfig(difficulty);
  const { size } = config;
  const overlay = config.overlays[Math.floor(Math.random() * config.overlays.length)];
  const regionCells = new Map();

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const regionId = overlay[row][column];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
      }
      regionCells.get(regionId).push([row, column]);
    }
  }

  const solution = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  const regions = [];
  let colorIndex = 0;

  for (const [regionId, cells] of regionCells.entries()) {
    const maxRequirement = Math.min(cells.length, settings.requirement.max);
    const minRequirement = Math.min(maxRequirement, settings.requirement.min);
    const range = maxRequirement - minRequirement;
    const requirement =
      range > 0
        ? Math.floor(Math.random() * (range + 1)) + minRequirement
        : maxRequirement;
    const chosenCells = shuffleArray(cells).slice(0, requirement);
    chosenCells.forEach(([row, column]) => {
      solution[row][column] = true;
    });

    const anchor = cells.reduce((best, cell) => {
      if (!best) {
        return cell;
      }
      if (cell[0] < best[0]) {
        return cell;
      }
      if (cell[0] === best[0] && cell[1] < best[1]) {
        return cell;
      }
      return best;
    }, null);

    const color = REGION_COLORS[colorIndex % REGION_COLORS.length];
    colorIndex += 1;

    regions.push({ id: regionId, requirement, anchor, color });
  }

  const rowTotals = solution.map((row) => row.filter(Boolean).length);
  const columnTotals = Array.from({ length: size }, (_, column) =>
    solution.reduce((sum, row) => sum + (row[column] ? 1 : 0), 0)
  );

  const exceedsRowOrColumnLimit =
    rowTotals.some((total) => total >= size || total > 6) ||
    columnTotals.some((total) => total >= size || total > 6);

  if (exceedsRowOrColumnLimit && attempt < 20) {
    return createPuzzle(difficulty, attempt + 1);
  }

  const regionsById = regions.reduce((accumulator, region) => {
    accumulator[String(region.id)] = region;
    return accumulator;
  }, {});

  return {
    size,
    solution,
    rowTotals,
    columnTotals,
    regionGrid: overlay,
    regions,
    regionsById
  };
};

const state = {
  difficulty: DEFAULT_DIFFICULTY,
  puzzle: null,
  boardState: []
};

state.puzzle = createPuzzle(state.difficulty);
state.boardState = createEmptyBoard(state.puzzle.size);

const appRoot = document.querySelector('.app');
const columnHintsContainer = document.getElementById('column-hints');
const boardContainer = document.getElementById('board');
const statusElement = document.getElementById('status');
const checkButton = document.getElementById('check-button');
const clearButton = document.getElementById('clear-button');
const newButton = document.getElementById('new-button');
const difficultyButtons = Array.from(document.querySelectorAll('[data-difficulty]'));

const columnHintElements = [];
const rowHintElements = [];
const cellElements = [];

const setBoardSizeVariable = (size) => {
  if (appRoot) {
    appRoot.style.setProperty('--board-size', String(size));
  }
};

setBoardSizeVariable(state.puzzle.size);

const getCurrentRowTotals = () =>
  state.boardState.map((row) => row.filter((cell) => cell === 'fruit').length);

const getCurrentColumnTotals = () => {
  const size = state.puzzle.size;
  return Array.from({ length: size }, (_, column) =>
    state.boardState.reduce((sum, row) => sum + (row[column] === 'fruit' ? 1 : 0), 0)
  );
};

const applyHintClasses = (element, current, target) => {
  element.classList.remove('hint-satisfied', 'hint-exceeded');
  if (current === target) {
    element.classList.add('hint-satisfied');
  } else if (current > target) {
    element.classList.add('hint-exceeded');
  }
};

const updateStatus = (type, text) => {
  statusElement.innerHTML = '';
  if (!text) {
    return;
  }

  const icon = document.createElement('span');
  icon.className = 'status-icon';
  if (type === 'success') {
    icon.classList.add('success');
  } else if (type === 'alert') {
    icon.classList.add('alert');
  } else {
    icon.classList.add('notice');
  }

  const statusText = document.createElement('span');
  statusText.className = 'status-text';
  statusText.textContent = text;

  statusElement.appendChild(icon);
  statusElement.appendChild(statusText);
};

const updateCell = (row, column) => {
  const element = cellElements[row][column];
  const stateValue = state.boardState[row][column];
  element.dataset.state = stateValue;
  if (stateValue === 'fruit') {
    element.textContent = '●';
  } else if (stateValue === 'mark') {
    element.textContent = '×';
  } else {
    element.textContent = '';
  }
};

const updateHints = () => {
  const currentRowTotals = getCurrentRowTotals();
  const currentColumnTotals = getCurrentColumnTotals();

  currentRowTotals.forEach((count, index) => {
    const element = rowHintElements[index];
    element.textContent = state.puzzle.rowTotals[index];
    applyHintClasses(element, count, state.puzzle.rowTotals[index]);
  });

  currentColumnTotals.forEach((count, index) => {
    const element = columnHintElements[index];
    element.textContent = state.puzzle.columnTotals[index];
    applyHintClasses(element, count, state.puzzle.columnTotals[index]);
  });
};

const updateBoard = () => {
  const size = state.puzzle.size;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      updateCell(row, column);
    }
  }
  updateHints();
};

const cycleCell = (row, column) => {
  const currentState = state.boardState[row][column];
  const nextState = CELL_STATES[(CELL_STATES.indexOf(currentState) + 1) % CELL_STATES.length];
  state.boardState[row][column] = nextState;
  updateCell(row, column);
  updateHints();
};

const resetBoard = () => {
  const size = state.puzzle.size;
  state.boardState = createEmptyBoard(size);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      updateCell(row, column);
    }
  }
  updateHints();
  updateStatus('notice', 'cleared');
};

const createBoardStructure = () => {
  const size = state.puzzle.size;
  setBoardSizeVariable(size);

  columnHintElements.length = 0;
  columnHintsContainer.innerHTML = '';
  state.puzzle.columnTotals.forEach((total, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'column-hint-cell';
    const text = document.createElement('span');
    text.className = 'hint-text';
    text.textContent = total;
    wrapper.appendChild(text);
    columnHintsContainer.appendChild(wrapper);
    columnHintElements[index] = text;
  });

  boardContainer.innerHTML = '';
  cellElements.length = 0;
  rowHintElements.length = 0;

  for (let row = 0; row < size; row += 1) {
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'board-row';

    const cellRow = document.createElement('div');
    cellRow.className = 'row-cells';
    const rowCells = [];

    for (let column = 0; column < size; column += 1) {
      const regionId = state.puzzle.regionGrid[row][column];
      const region = state.puzzle.regionsById[String(regionId)];

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.row = row;
      button.dataset.column = column;
      button.dataset.state = 'empty';
      button.dataset.region = regionId;
      button.style.setProperty('--region-color', region.color);
      button.setAttribute(
        'aria-label',
        `Row ${row + 1}, column ${column + 1}. Part of a shape needing ${region.requirement} apples.`
      );

      if (region.anchor[0] === row && region.anchor[1] === column) {
        button.dataset.requirement = region.requirement;
      }

      cellRow.appendChild(button);
      rowCells[column] = button;
    }

    const hintWrapper = document.createElement('div');
    hintWrapper.className = 'row-hint-cell';
    const hintText = document.createElement('span');
    hintText.className = 'hint-text';
    hintText.textContent = state.puzzle.rowTotals[row];
    hintWrapper.appendChild(hintText);

    rowHintElements[row] = hintText;
    cellElements[row] = rowCells;

    rowWrapper.appendChild(cellRow);
    rowWrapper.appendChild(hintWrapper);
    boardContainer.appendChild(rowWrapper);
  }
};

const checkSolution = () => {
  const { rowTotals, columnTotals, regionGrid, regions, size } = state.puzzle;

  const currentRowTotals = getCurrentRowTotals();
  const currentColumnTotals = getCurrentColumnTotals();

  const rowsMatch = currentRowTotals.every((count, index) => count === rowTotals[index]);
  const columnsMatch = currentColumnTotals.every((count, index) => count === columnTotals[index]);

  const regionCounts = new Map();
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (state.boardState[row][column] === 'fruit') {
        const regionId = regionGrid[row][column];
        regionCounts.set(regionId, (regionCounts.get(regionId) || 0) + 1);
      }
    }
  }

  const regionsMatch = regions.every((region) => {
    const count = regionCounts.get(region.id) || 0;
    return count === region.requirement;
  });

  if (rowsMatch && columnsMatch && regionsMatch) {
    updateStatus('success', 'success');
  } else {
    updateStatus('alert', 'keep going');
  }
};

const newPuzzle = ({ announce = true } = {}) => {
  state.puzzle = createPuzzle(state.difficulty);
  state.boardState = createEmptyBoard(state.puzzle.size);
  createBoardStructure();
  updateBoard();
  if (announce) {
    updateStatus('notice', 'changed');
  }
};

const updateDifficultyButtons = () => {
  difficultyButtons.forEach((button) => {
    const difficulty = button.dataset.difficulty;
    const isActive = difficulty === state.difficulty;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
};

const setDifficulty = (difficulty) => {
  if (!DIFFICULTIES[difficulty] || state.difficulty === difficulty) {
    return;
  }
  state.difficulty = difficulty;
  updateDifficultyButtons();
  newPuzzle({ announce: false });
};

boardContainer.addEventListener('click', (event) => {
  const target = event.target.closest('.cell');
  if (!target || !boardContainer.contains(target)) {
    return;
  }
  const row = Number(target.dataset.row);
  const column = Number(target.dataset.column);
  cycleCell(row, column);
});

checkButton.addEventListener('click', checkSolution);
clearButton.addEventListener('click', resetBoard);
newButton.addEventListener('click', newPuzzle);
difficultyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setDifficulty(button.dataset.difficulty);
  });
});

createBoardStructure();
updateBoard();
updateStatus();
updateDifficultyButtons();
