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
    requirement: { min: 2, max: 5 }
  }
};

const DEFAULT_DIFFICULTY = 'normal';
const STORAGE_KEY = 'puzl-daily-state-v1';

const MAX_GENERATION_ATTEMPTS = 40;

const chooseRegionRequirement = (difficulty, minRequirement, maxRequirement) => {
  if (maxRequirement <= minRequirement) {
    return maxRequirement;
  }

  if (difficulty === 'hard') {
    const weighted = [];
    const span = maxRequirement - minRequirement;
    for (let value = minRequirement; value <= maxRequirement; value += 1) {
      if (span <= 0) {
        weighted.push(value);
        continue;
      }

      const distanceFromMax = maxRequirement - value;
      const distanceFromMin = value - minRequirement;
      const baseWeight = distanceFromMax + 1;
      const lowerBias = distanceFromMin === 0 && span > 1 ? 1 : 0;
      const weight = Math.max(1, baseWeight + lowerBias);
      for (let index = 0; index < weight; index += 1) {
        weighted.push(value);
      }
    }
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  return Math.floor(Math.random() * (maxRequirement - minRequirement + 1)) + minRequirement;
};

const getTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const cloneBoard = (board) => board.map((row) => [...row]);

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return parsed;
  } catch (error) {
    console.error('Failed to read stored puzzle state', error);
    return {};
  }
};

const writeStorage = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to store puzzle state', error);
  }
};

const getTimestamp = () => new Date().toISOString();

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
  const regionSizes = Array.from(regionCells.values(), (cells) => cells.length);
  const largestRegionSize = regionSizes.reduce((max, current) => Math.max(max, current), 0);

  for (const [regionId, cells] of regionCells.entries()) {
    const maxRequirement = Math.min(cells.length, settings.requirement.max);
    const minRequirement = Math.min(maxRequirement, settings.requirement.min);
    const requirement = chooseRegionRequirement(difficulty, minRequirement, maxRequirement);
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

  const highRequirementCount = regions.filter((region) => region.requirement >= 4).length;
  const requirementFiveCount = regions.filter((region) => region.requirement >= 5).length;
  const smallRequirementCount = regions.filter((region) => region.requirement <= 2).length;
  const smallColumnCount = columnTotals.filter((total) => total >= 1 && total <= 2).length;

  const requiresHardRegeneration =
    difficulty === 'hard' &&
    (highRequirementCount < 2 ||
      (largestRegionSize >= 5 && requirementFiveCount < 1) ||
      smallColumnCount < Math.min(2, size) ||
      smallRequirementCount > Math.ceil(regions.length / 2));

  if ((exceedsRowOrColumnLimit || requiresHardRegeneration) && attempt < MAX_GENERATION_ATTEMPTS) {
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

let storage = readStorage();
let currentEntry = null;

const state = {
  difficulty: DEFAULT_DIFFICULTY,
  puzzle: null,
  boardState: [],
  isSolved: false,
  timer: {
    running: false,
    intervalId: null,
    secondsElapsed: 0
  }
};

const appRoot = document.querySelector('.app');
const columnHintsContainer = document.getElementById('column-hints');
const boardContainer = document.getElementById('board');
const statusElement = document.getElementById('status');
const checkButton = document.getElementById('check-button');
const clearButton = document.getElementById('clear-button');
const timerElement = document.getElementById('timer-display');
const testButton = document.getElementById('test-new-button');
const difficultyButtons = Array.from(document.querySelectorAll('[data-difficulty]'));

const columnHintElements = [];
const rowHintElements = [];
const cellElements = [];

const ensurePuzzlesStorage = () => {
  if (!storage.puzzles || typeof storage.puzzles !== 'object') {
    storage.puzzles = {};
  }
  return storage.puzzles;
};

const persistCurrentState = (additional = {}) => {
  if (!currentEntry) {
    return;
  }
  const puzzles = ensurePuzzlesStorage();
  currentEntry = {
    ...currentEntry,
    puzzle: state.puzzle,
    boardState: cloneBoard(state.boardState),
    secondsElapsed: state.timer.secondsElapsed,
    updatedAt: getTimestamp(),
    ...additional
  };
  puzzles[state.difficulty] = currentEntry;
  storage.difficulty = state.difficulty;
  writeStorage(storage);
};

const formatTime = (seconds) => {
  const totalSeconds = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const updateTimerLockState = () => {
  if (!timerElement) {
    return;
  }
  if (state.isSolved) {
    timerElement.dataset.locked = 'true';
    timerElement.setAttribute('aria-label', 'Time spent (locked)');
  } else {
    timerElement.setAttribute('aria-label', 'Time spent');
    delete timerElement.dataset.locked;
  }
};

const updateTimerDisplay = () => {
  if (timerElement) {
    timerElement.textContent = formatTime(state.timer.secondsElapsed);
  }
  updateTimerLockState();
};

const stopTimer = () => {
  if (state.timer.intervalId) {
    window.clearInterval(state.timer.intervalId);
  }
  state.timer.intervalId = null;
  state.timer.running = false;
};

const resetTimer = (seconds = 0) => {
  stopTimer();
  state.timer.secondsElapsed = seconds;
  updateTimerDisplay();
};

const startTimer = () => {
  if (state.timer.running) {
    return;
  }
  state.timer.running = true;
  state.timer.intervalId = window.setInterval(() => {
    state.timer.secondsElapsed += 1;
    updateTimerDisplay();
    persistCurrentState();
  }, 1000);
  persistCurrentState();
};

const loadPuzzle = ({ difficulty = state.difficulty, forceNew = false } = {}) => {
  const puzzles = ensurePuzzlesStorage();
  const todayKey = getTodayKey();
  let entry = puzzles[difficulty];

  if (!entry || entry.date !== todayKey || forceNew) {
    const puzzle = createPuzzle(difficulty);
    const boardState = createEmptyBoard(puzzle.size);
    entry = {
      date: todayKey,
      puzzle,
      boardState,
      solved: false,
      solvedAt: null,
      status: null,
      secondsElapsed: 0,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };
  }

  puzzles[difficulty] = entry;
  storage.difficulty = difficulty;
  writeStorage(storage);

  currentEntry = entry;
  state.difficulty = difficulty;
  state.puzzle = entry.puzzle;
  state.boardState = cloneBoard(entry.boardState);
  state.isSolved = Boolean(entry.solved);
  if (currentEntry && !Object.prototype.hasOwnProperty.call(currentEntry, 'status')) {
    currentEntry.status = null;
  }
  resetTimer(entry.secondsElapsed || 0);
};

const renderCurrentPuzzle = ({ announce = false, message, additionalState } = {}) => {
  createBoardStructure();
  updateBoard();
  updateTimerDisplay();
  let statusDetails = null;

  if (announce) {
    statusDetails = { type: 'notice', text: message || 'New board ready' };
  }

  if (additionalState && Object.prototype.hasOwnProperty.call(additionalState, 'status')) {
    statusDetails = additionalState.status;
  } else if (!statusDetails && currentEntry?.status) {
    statusDetails = currentEntry.status;
  }

  if (statusDetails && statusDetails.text) {
    updateStatus(statusDetails.type, statusDetails.text);
  } else {
    updateStatus();
  }
  updateDifficultyButtons();
  const stateToPersist =
    additionalState || (announce && statusDetails ? { status: statusDetails } : undefined);
  persistCurrentState(stateToPersist);
};

const setBoardSizeVariable = (size) => {
  if (appRoot) {
    appRoot.style.setProperty('--board-size', String(size));
  }
};

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
    element.textContent = '★';
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
  startTimer();
  const currentState = state.boardState[row][column];
  const nextState = CELL_STATES[(CELL_STATES.indexOf(currentState) + 1) % CELL_STATES.length];
  state.boardState[row][column] = nextState;
  updateCell(row, column);
  updateHints();
  if (state.isSolved) {
    state.isSolved = false;
    updateTimerLockState();
  }
  persistCurrentState({ solved: false, solvedAt: null, status: null });
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
  resetTimer(0);
  updateStatus('notice', 'Board cleared');
  state.isSolved = false;
  updateTimerLockState();
  persistCurrentState({
    solved: false,
    solvedAt: null,
    status: { type: 'notice', text: 'Board cleared' }
  });
};

const createBoardStructure = () => {
  const size = state.puzzle.size;
  setBoardSizeVariable(size);

  columnHintElements.length = 0;
  columnHintsContainer.innerHTML = '';
  const columnHintGrid = document.createElement('div');
  columnHintGrid.className = 'column-hints-grid';
  state.puzzle.columnTotals.forEach((total, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'column-hint-cell';
    const text = document.createElement('span');
    text.className = 'hint-text';
    text.textContent = total;
    wrapper.appendChild(text);
    columnHintGrid.appendChild(wrapper);
    columnHintElements[index] = text;
  });
  columnHintsContainer.appendChild(columnHintGrid);
  const spacer = document.createElement('div');
  spacer.className = 'column-hint-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  columnHintsContainer.appendChild(spacer);

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
    stopTimer();
    state.isSolved = true;
    updateTimerLockState();
    updateStatus('success', 'Solved!');
    persistCurrentState({
      solved: true,
      solvedAt: getTimestamp(),
      status: { type: 'success', text: 'Solved!' }
    });
  } else {
    updateStatus('alert', 'Keep going');
    state.isSolved = false;
    updateTimerLockState();
    persistCurrentState({
      solved: false,
      solvedAt: null,
      status: { type: 'alert', text: 'Keep going' }
    });
  }
};

const newPuzzle = ({ announce = true, forceNew = false } = {}) => {
  loadPuzzle({ difficulty: state.difficulty, forceNew });
  renderCurrentPuzzle({
    announce,
    message: forceNew ? 'New board created' : 'Board ready',
    additionalState: {
      solved: false,
      solvedAt: null,
      status: { type: 'notice', text: forceNew ? 'New board created' : 'Board ready' }
    }
  });
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
  loadPuzzle({ difficulty, forceNew: false });
  const message = `Difficulty set to ${DIFFICULTIES[difficulty].label}`;
  renderCurrentPuzzle({
    announce: true,
    message,
    additionalState: {
      solved: false,
      solvedAt: null,
      status: { type: 'notice', text: message }
    }
  });
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

boardContainer.addEventListener('dblclick', (event) => {
  event.preventDefault();
  event.stopPropagation();
});

checkButton.addEventListener('click', checkSolution);
clearButton.addEventListener('click', resetBoard);
difficultyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setDifficulty(button.dataset.difficulty);
  });
});

if (testButton) {
  testButton.addEventListener('click', () => {
    newPuzzle({ announce: true, forceNew: true });
  });
}

const initializeApp = () => {
  const storedDifficulty = storage.difficulty;
  if (storedDifficulty && DIFFICULTIES[storedDifficulty]) {
    state.difficulty = storedDifficulty;
  }
  loadPuzzle({ difficulty: state.difficulty, forceNew: false });
  renderCurrentPuzzle({ announce: false });
};

initializeApp();
