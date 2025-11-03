const PUZZLE_LIBRARY = [
  {
    size: 8,
    weight: 12,
    overlays: [
      [
        [0, 0, 0, 1, 1, 2, 2, 3],
        [4, 4, 0, 1, 5, 2, 6, 3],
        [4, 7, 0, 8, 5, 5, 6, 3],
        [9, 7, 10, 8, 8, 11, 6, 12],
        [9, 13, 10, 14, 15, 11, 16, 12],
        [17, 13, 18, 14, 15, 19, 16, 20],
        [17, 21, 18, 22, 22, 19, 23, 20],
        [24, 21, 25, 25, 26, 19, 23, 27]
      ],
      [
        [0, 0, 1, 1, 2, 2, 3, 3],
        [0, 4, 1, 5, 2, 6, 6, 3],
        [0, 4, 5, 5, 7, 6, 8, 3],
        [0, 10, 10, 11, 7, 7, 8, 12],
        [9, 13, 14, 11, 15, 16, 8, 12],
        [17, 13, 14, 18, 15, 16, 19, 19],
        [17, 20, 20, 18, 21, 22, 23, 19],
        [24, 20, 25, 25, 21, 22, 23, 26]
      ],
      [
        [0, 0, 1, 1, 2, 2, 3, 3],
        [4, 0, 1, 5, 2, 6, 6, 3],
        [0, 7, 7, 5, 8, 6, 9, 9],
        [0, 7, 11, 11, 8, 12, 12, 13],
        [10, 14, 14, 15, 8, 16, 17, 13],
        [18, 19, 14, 15, 20, 16, 17, 21],
        [18, 19, 22, 22, 20, 23, 24, 21],
        [25, 26, 22, 27, 27, 23, 24, 28]
      ],
      [
        [0, 1, 1, 2, 2, 3, 3, 4],
        [0, 0, 5, 5, 6, 6, 7, 4],
        [8, 0, 5, 9, 9, 10, 7, 11],
        [0, 12, 13, 13, 14, 10, 15, 11],
        [16, 12, 13, 17, 14, 18, 15, 19],
        [16, 20, 21, 17, 22, 18, 23, 19],
        [24, 20, 21, 25, 22, 26, 23, 27],
        [24, 28, 28, 25, 29, 29, 30, 27]
      ]
    ]
  }
];

const TRANSLATIONS = {
  en: {
    difficultyLabel: 'Difficulty',
    difficultyEasy: 'Easy',
    difficultyNormal: 'Normal',
    difficultyHard: 'Hard',
    difficultyExtreme: 'Extreme',
    columnHintsLabel: 'Column clues',
    boardAriaLabel: 'Puzzle board',
    actionCheck: 'Check',
    actionClear: 'Clear',
    actionNewBoard: 'New board',
    actionResetProgress: 'Reset local progress',
    timeSpent: 'Time spent',
    timeSpentLocked: 'Time spent (locked)',
    statusNewBoardReady: 'New board ready',
    statusBoardReady: 'Board ready',
    statusNewBoardCreated: 'New board created',
    statusBoardCleared: 'Board cleared',
    statusSolved: 'Solved!',
    statusKeepGoing: 'Keep going',
    statusProgressCleared: 'Progress cleared. Fresh boards await.',
    difficultySet: 'Difficulty set to {difficulty}',
    footer: 'Balance each shape badge while matching every row and column total.',
    cellAria:
      'Row {row}, column {column}. Part of a shape needing {requirement} apples.'
  },
  nb: {
    difficultyLabel: 'Vanskelighetsgrad',
    difficultyEasy: 'Lett',
    difficultyNormal: 'Normal',
    difficultyHard: 'Vanskelig',
    difficultyExtreme: 'Ekstrem',
    columnHintsLabel: 'Kolonnehint',
    boardAriaLabel: 'Puslespillbrett',
    actionCheck: 'Sjekk',
    actionClear: 'Tøm',
    actionNewBoard: 'Nytt brett',
    actionResetProgress: 'Tilbakestill lokal fremdrift',
    timeSpent: 'Brukt tid',
    timeSpentLocked: 'Brukt tid (låst)',
    statusNewBoardReady: 'Nytt brett klart',
    statusBoardReady: 'Brett klart',
    statusNewBoardCreated: 'Nytt brett opprettet',
    statusBoardCleared: 'Brett tømt',
    statusSolved: 'Løst!',
    statusKeepGoing: 'Fortsett',
    difficultySet: 'Vanskelighetsgrad satt til {difficulty}',
    statusProgressCleared: 'Fremdrift slettet. Klar for nye brett.',
    footer: 'Match hver rad- og kolonneverdi mens hvert område får riktig antall merker.',
    cellAria:
      'Rad {row}, kolonne {column}. Del av en form som trenger {requirement} epler.'
  }
};

const LOCALE_ALIASES = {
  no: 'nb',
  nn: 'nb'
};

const DEFAULT_LOCALE = 'en';

const detectLocale = () => {
  const languages = [];
  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) {
      languages.push(...navigator.languages);
    }
    if (navigator.language) {
      languages.push(navigator.language);
    }
  }

  for (const candidate of languages) {
    if (!candidate) {
      continue;
    }
    const normalized = String(candidate).toLowerCase();
    const normalizedAlias = LOCALE_ALIASES[normalized];
    if (normalizedAlias && Object.prototype.hasOwnProperty.call(TRANSLATIONS, normalizedAlias)) {
      return normalizedAlias;
    }
    if (Object.prototype.hasOwnProperty.call(TRANSLATIONS, normalized)) {
      return normalized;
    }
    const base = normalized.split('-')[0];
    const baseAlias = LOCALE_ALIASES[base];
    if (baseAlias && Object.prototype.hasOwnProperty.call(TRANSLATIONS, baseAlias)) {
      return baseAlias;
    }
    if (Object.prototype.hasOwnProperty.call(TRANSLATIONS, base)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
};

const ACTIVE_LOCALE = detectLocale();

const translate = (key, variables = {}) => {
  const dictionary = TRANSLATIONS[ACTIVE_LOCALE] || TRANSLATIONS[DEFAULT_LOCALE];
  const fallback = TRANSLATIONS[DEFAULT_LOCALE] || {};
  const template =
    (dictionary && Object.prototype.hasOwnProperty.call(dictionary, key)
      ? dictionary[key]
      : fallback[key]) || key;

  if (typeof template !== 'string') {
    return key;
  }

  return template.replace(/\{(\w+)\}/g, (_, token) => {
    if (Object.prototype.hasOwnProperty.call(variables, token)) {
      return variables[token];
    }
    return `{${token}}`;
  });
};

const DIFFICULTIES = {
  easy: {
    labelKey: 'difficultyEasy',
    allowedSizes: [8],
    requirement: { min: 1, max: 2 }
  },
  normal: {
    labelKey: 'difficultyNormal',
    allowedSizes: [8],
    requirement: { min: 1, max: 3 }
  },
  hard: {
    labelKey: 'difficultyHard',
    allowedSizes: [8],
    requirement: { min: 2, max: 5 }
  },
  extreme: {
    labelKey: 'difficultyExtreme',
    allowedSizes: [8],
    requirement: { min: 3, max: 6 }
  }
};

const DEFAULT_DIFFICULTY = 'normal';
const STORAGE_KEY = 'puzl-daily-state-v1';

const MAX_GENERATION_ATTEMPTS = 40;

const chooseRegionRequirement = (difficulty, minRequirement, maxRequirement) => {
  if (maxRequirement <= minRequirement) {
    return maxRequirement;
  }

  if (difficulty === 'hard' || difficulty === 'extreme') {
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
  const largeRegionCount = regionSizes.filter((size) => size >= 5).length;

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

  const hardMaxRowColumnTotal = 5;
  const rowLimitExceeded =
    difficulty === 'hard'
      ? rowTotals.some((total) => total > hardMaxRowColumnTotal)
      : rowTotals.some((total) => total >= size);
  const columnLimitExceeded =
    difficulty === 'hard'
      ? columnTotals.some((total) => total > hardMaxRowColumnTotal)
      : columnTotals.some((total) => total >= size);

  const exceedsRowOrColumnLimit =
    rowTotals.some((total) => total > 6) ||
    columnTotals.some((total) => total > 6) ||
    rowLimitExceeded ||
    columnLimitExceeded;

  const rowMaxCount =
    difficulty === 'hard'
      ? rowTotals.filter((total) => total === hardMaxRowColumnTotal).length
      : 0;
  const columnMaxCount =
    difficulty === 'hard'
      ? columnTotals.filter((total) => total === hardMaxRowColumnTotal).length
      : 0;

  const highRequirementCount = regions.filter((region) => region.requirement >= 4).length;
  const requirementFiveCount = regions.filter((region) => region.requirement >= 5).length;
  const smallRequirementCount = regions.filter((region) => region.requirement <= 2).length;
  const smallColumnCount = columnTotals.filter((total) => total >= 1 && total <= 2).length;

  const requiresHardRegeneration =
    (difficulty === 'hard' || difficulty === 'extreme') &&
    (highRequirementCount < 2 ||
      largeRegionCount < 1 ||
      (largestRegionSize >= 5 && requirementFiveCount < 1) ||
      smallColumnCount < Math.min(2, size) ||
      smallRequirementCount > Math.ceil(regions.length / 2) ||
      rowMaxCount > 1 ||
      columnMaxCount > 1);

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
const difficultyToggleElement = document.querySelector('.difficulty-toggle');
const columnHintsContainer = document.getElementById('column-hints');
const boardContainer = document.getElementById('board');
const statusElement = document.getElementById('status');
const checkButton = document.getElementById('check-button');
const clearButton = document.getElementById('clear-button');
const timerElement = document.getElementById('timer-display');
const testButton = document.getElementById('test-new-button');
const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-option'));
const extremeDifficultyButton = difficultyButtons.find(
  (button) => button.dataset.difficulty === 'extreme'
);
const footerElement = document.querySelector('.footer');
const resetProgressButton = document.getElementById('reset-progress-button');

const columnHintElements = [];
const rowHintElements = [];
const cellElements = [];

const ensurePuzzlesStorage = () => {
  if (!storage.puzzles || typeof storage.puzzles !== 'object') {
    storage.puzzles = {};
  }
  return storage.puzzles;
};

const hasSolvedHardPuzzle = () => {
  const puzzles = ensurePuzzlesStorage();
  const hardEntry = puzzles.hard;
  return Boolean(hardEntry && hardEntry.solved);
};

const updateExtremeAvailability = () => {
  if (!extremeDifficultyButton) {
    return;
  }
  const unlocked = hasSolvedHardPuzzle();
  if (unlocked) {
    extremeDifficultyButton.hidden = false;
    extremeDifficultyButton.disabled = false;
  } else {
    extremeDifficultyButton.hidden = true;
    extremeDifficultyButton.disabled = true;
    extremeDifficultyButton.classList.remove('is-active');
    extremeDifficultyButton.setAttribute('aria-pressed', 'false');
  }
};

const applyTranslations = () => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = ACTIVE_LOCALE;
  }

  if (difficultyToggleElement) {
    difficultyToggleElement.setAttribute('aria-label', translate('difficultyLabel'));
  }

  difficultyButtons.forEach((button) => {
    const difficulty = button.dataset.difficulty;
    const settings = DIFFICULTIES[difficulty];
    if (settings?.labelKey) {
      button.textContent = translate(settings.labelKey);
    }
  });

  if (columnHintsContainer) {
    columnHintsContainer.setAttribute('aria-label', translate('columnHintsLabel'));
  }

  if (boardContainer) {
    boardContainer.setAttribute('aria-label', translate('boardAriaLabel'));
  }

  if (checkButton) {
    checkButton.textContent = translate('actionCheck');
  }

  if (clearButton) {
    clearButton.textContent = translate('actionClear');
  }

  if (testButton) {
    testButton.textContent = translate('actionNewBoard');
  }

  if (timerElement) {
    timerElement.setAttribute('aria-label', translate('timeSpent'));
  }

  if (footerElement) {
    footerElement.textContent = translate('footer');
  }

  if (resetProgressButton) {
    const label = translate('actionResetProgress');
    resetProgressButton.setAttribute('aria-label', label);
    resetProgressButton.setAttribute('title', label);
  }
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
    timerElement.setAttribute('aria-label', translate('timeSpentLocked'));
  } else {
    timerElement.setAttribute('aria-label', translate('timeSpent'));
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

const resetProgress = () => {
  stopTimer();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear stored puzzle state', error);
  }
  storage = readStorage();
  currentEntry = null;
  state.difficulty = DEFAULT_DIFFICULTY;
  state.puzzle = null;
  state.boardState = [];
  state.isSolved = false;
  state.timer.secondsElapsed = 0;
  state.timer.intervalId = null;
  state.timer.running = false;
  const message = translate('statusProgressCleared');
  loadPuzzle({ difficulty: state.difficulty, forceNew: true });
  renderCurrentPuzzle({
    announce: true,
    message,
    additionalState: {
      solved: false,
      solvedAt: null,
      status: { type: 'notice', text: message }
    }
  });
  updateExtremeAvailability();
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
  setAppDifficultyAttribute(difficulty);
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
    statusDetails = {
      type: 'notice',
      text: message || translate('statusNewBoardReady')
    };
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
  updateExtremeAvailability();
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

const setAppDifficultyAttribute = (difficulty) => {
  if (appRoot) {
    appRoot.dataset.difficulty = difficulty;
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
  const clearedMessage = translate('statusBoardCleared');
  updateStatus('notice', clearedMessage);
  state.isSolved = false;
  updateTimerLockState();
  persistCurrentState({
    solved: false,
    solvedAt: null,
    status: { type: 'notice', text: clearedMessage }
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
        translate('cellAria', {
          row: row + 1,
          column: column + 1,
          requirement: region.requirement
        })
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
    const solvedMessage = translate('statusSolved');
    updateStatus('success', solvedMessage);
    persistCurrentState({
      solved: true,
      solvedAt: getTimestamp(),
      status: { type: 'success', text: solvedMessage }
    });
    if (state.difficulty === 'hard') {
      updateExtremeAvailability();
    }
  } else {
    const keepGoingMessage = translate('statusKeepGoing');
    updateStatus('alert', keepGoingMessage);
    state.isSolved = false;
    updateTimerLockState();
    persistCurrentState({
      solved: false,
      solvedAt: null,
      status: { type: 'alert', text: keepGoingMessage }
    });
  }
};

const newPuzzle = ({ announce = true, forceNew = false } = {}) => {
  loadPuzzle({ difficulty: state.difficulty, forceNew });
  const message = forceNew
    ? translate('statusNewBoardCreated')
    : translate('statusBoardReady');
  renderCurrentPuzzle({
    announce,
    message,
    additionalState: {
      solved: false,
      solvedAt: null,
      status: { type: 'notice', text: message }
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
  if (difficulty === 'extreme' && !hasSolvedHardPuzzle()) {
    return;
  }
  loadPuzzle({ difficulty, forceNew: false });
  const difficultyLabel = translate(DIFFICULTIES[difficulty].labelKey);
  const message = translate('difficultySet', { difficulty: difficultyLabel });
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

if (resetProgressButton) {
  resetProgressButton.addEventListener('click', () => {
    resetProgress();
  });
}

const initializeApp = () => {
  applyTranslations();
  const storedDifficulty = storage.difficulty;
  if (storedDifficulty && DIFFICULTIES[storedDifficulty]) {
    state.difficulty = storedDifficulty;
  }
  loadPuzzle({ difficulty: state.difficulty, forceNew: false });
  renderCurrentPuzzle({ announce: false });
};

initializeApp();
