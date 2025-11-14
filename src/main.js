import { ACTIVE_LOCALE, translate } from './config/translations.js';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from './config/difficulties.js';
import { DEFAULT_COLOR_PALETTE_ID, getPaletteColorsById } from './palette.js';
import { CELL_STATES, createEmptyBoard, createPuzzle } from './puzzle.js';
import { cloneBoard } from './utils/board.js';
import {
  STORAGE_KEY,
  getTimestamp,
  getTodayKey,
  readStorage,
  writeStorage
} from './storage.js';
import { formatTime } from './app/time.js';
import { createLeaderboardManager } from './app/leaderboard.js';
import { createPostScoreController } from './app/postScore.js';
import { formatScore } from './utils/score.js';
const SUPABASE_URL = 'https://kbmtgjpvzssvyvbacxzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibXRnanB2enNzdnl2YmFjeHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjgyMjksImV4cCI6MjA3ODcwNDIyOX0.lUhYyiRyziuMZJDfnKfwmWjwlP0scMJ_Xiam827fnxg';
const SUPABASE_LEADERBOARD_TABLE = 'leaderboard';

const activeColorPaletteId = DEFAULT_COLOR_PALETTE_ID;
const REGION_FILL_OPACITY = 0.3;

let storage = readStorage();
if (typeof storage.controlsLocked !== 'boolean') {
  storage.controlsLocked = false;
}
if (typeof storage.regionFillEnabled !== 'boolean') {
  storage.regionFillEnabled = true;
}
let currentEntry = null;

const state = {
  difficulty: DEFAULT_DIFFICULTY,
  puzzle: null,
  boardState: [],
  isSolved: false,
  controlsLocked: Boolean(storage.controlsLocked),
  regionFillEnabled: Boolean(storage.regionFillEnabled),
  timer: {
    running: false,
    intervalId: null,
    secondsElapsed: 0
  },
  leaderboardView: 'local',
  globalLeaderboard: [],
  globalLeaderboardLoaded: false,
  globalLeaderboardLoading: false,
  globalLeaderboardError: null,
  postScoreSubmitting: false
};

const formatScoreValue = (value) => formatScore(value, ACTIVE_LOCALE);

const appRoot = document.querySelector('.app');
const difficultyToggleElement = document.querySelector('.difficulty-toggle');
const columnHintsContainer = document.getElementById('column-hints');
const boardContainer = document.getElementById('board');
const statusElement = document.getElementById('status');
const checkButton = document.getElementById('check-button');
const clearButton = document.getElementById('clear-button');
const timerElement = document.getElementById('timer-display');
const testButton = document.getElementById('test-new-button');
const lockControlsButton = document.getElementById('lock-controls-button');
const regionFillToggleButton = document.getElementById('region-fill-toggle-button');
const postScoreButton = document.getElementById('post-score-button');
const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-option'));
const extremeDifficultyButton = difficultyButtons.find(
  (button) => button.dataset.difficulty === 'extreme'
);
const footerDescriptionElement = document.getElementById('footer-description');
const resetProgressButton = document.getElementById('reset-progress-button');
const leaderboardButton = document.getElementById('leaderboard-button');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardEmptyState = document.getElementById('leaderboard-empty-state');
const leaderboardTabs = Array.from(document.querySelectorAll('.leaderboard-tab'));
const leaderboardGlobalList = document.getElementById('leaderboard-global-list');
const leaderboardGlobalEmptyState = document.getElementById('leaderboard-global-empty-state');
const leaderboardGlobalLoading = document.getElementById('leaderboard-global-loading');
const leaderboardCloseButton = document.getElementById('leaderboard-close-button');
const leaderboardTitleElement = document.getElementById('leaderboard-title');

const postScoreOverlay = document.getElementById('post-score-overlay');
const postScoreForm = document.getElementById('post-score-form');
const postScoreInput = document.getElementById('post-score-initials');
const postScoreScoreElement = document.getElementById('post-score-value');
const postScoreSubmitButton = document.getElementById('post-score-submit-button');
const postScoreCancelButton = document.getElementById('post-score-cancel-button');
const postScoreTitleElement = document.getElementById('post-score-title');
const postScoreDescriptionElement = document.getElementById('post-score-description');
const postScoreScoreLabelElement = document.getElementById('post-score-score-label');

let leaderboardController = null;
let postScoreController = null;

const columnHintElements = [];
const rowHintElements = [];
const cellElements = [];

const computeRegionFillColor = (color, opacity = REGION_FILL_OPACITY) => {
  if (typeof color !== 'string') {
    return 'transparent';
  }

  const trimmed = color.trim();

  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((value) => value + value)
        .join('');
    }
    if (hex.length === 6 || hex.length === 8) {
      const hasAlpha = hex.length === 8;
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const alpha = hasAlpha ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
      const combinedAlpha = Math.max(0, Math.min(1, alpha * opacity));
      return `rgba(${r}, ${g}, ${b}, ${combinedAlpha})`;
    }
  }

  const rgbaMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',').map((value) => value.trim());
    if (parts.length >= 3) {
      const r = Number.parseFloat(parts[0]);
      const g = Number.parseFloat(parts[1]);
      const b = Number.parseFloat(parts[2]);
      const alpha = parts.length === 4 ? Number.parseFloat(parts[3]) || 0 : 1;
      const combinedAlpha = Math.max(0, Math.min(1, alpha * opacity));
      return `rgba(${r}, ${g}, ${b}, ${combinedAlpha})`;
    }
  }

  return trimmed;
};

const applyActivePaletteToPuzzle = (puzzle) => {
  if (!puzzle) {
    return;
  }
  const colors = getPaletteColorsById(activeColorPaletteId);
  const length = colors.length || 1;
  puzzle.regions.forEach((region, index) => {
    const color = colors[index % length];
    region.color = color;
    if (puzzle.regionsById) {
      const key = String(region.id);
      const mapped = puzzle.regionsById[key];
      if (mapped && mapped !== region) {
        mapped.color = color;
      }
    }
  });
};

const applyPaletteToBoardElements = () => {
  if (!state.puzzle || !cellElements.length) {
    return;
  }
  const { size, regionGrid, regionsById } = state.puzzle;
  for (let row = 0; row < size; row += 1) {
    const rowElements = cellElements[row];
    if (!rowElements) {
      continue;
    }
    for (let column = 0; column < size; column += 1) {
      const element = rowElements[column];
      if (!element) {
        continue;
      }
      const regionId = regionGrid[row][column];
      const region = regionsById[String(regionId)];
      if (region?.color) {
        element.style.setProperty('--region-color', region.color);
        element.style.setProperty(
          '--region-fill-color',
          computeRegionFillColor(region.color, REGION_FILL_OPACITY)
        );
      }
    }
  }
};


const ensurePuzzlesStorage = () => {
  if (!storage.puzzles || typeof storage.puzzles !== 'object') {
    storage.puzzles = {};
  }
  return storage.puzzles;
};

const markExtremeUnlocked = () => {
  if (!storage.extremeUnlocked) {
    storage.extremeUnlocked = true;
    writeStorage(storage);
  }
};

const isExtremeDifficultyUnlocked = () => {
  if (storage.extremeUnlocked) {
    return true;
  }

  const puzzles = ensurePuzzlesStorage();
  const hardEntry = puzzles.hard;
  if (hardEntry?.solved) {
    markExtremeUnlocked();
    return true;
  }

  return false;
};

const updateExtremeAvailability = () => {
  if (!extremeDifficultyButton) {
    return;
  }
  const unlocked = isExtremeDifficultyUnlocked();
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

  updateRegionFillState();

  if (lockControlsButton) {
    const labelKey = state.controlsLocked ? 'actionUnlockControls' : 'actionLockControls';
    const label = translate(labelKey);
    lockControlsButton.setAttribute('aria-label', label);
    lockControlsButton.setAttribute('title', label);
  }

  if (timerElement) {
    timerElement.setAttribute('aria-label', translate('timeSpent'));
  }

  if (footerDescriptionElement) {
    footerDescriptionElement.textContent = translate('footer');
  }


  if (resetProgressButton) {
    const label = translate('actionResetProgress');
    resetProgressButton.setAttribute('aria-label', label);
    resetProgressButton.setAttribute('title', label);
  }

  leaderboardController?.applyTranslations();
  postScoreController?.applyTranslations();
};

const persistCurrentState = (additional = {}) => {
  if (!currentEntry) {
    writeStorage(storage);
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
  syncControlsLockToStorage();
  writeStorage(storage);
};

const recordLeaderboardEntry = () => {
  if (!currentEntry) {
    return;
  }

  const boardId = currentEntry.createdAt || `${state.difficulty}-${currentEntry.date || getTimestamp()}`;
  const seconds = state.timer.secondsElapsed;
  const solvedAt = getTimestamp();

  leaderboardController?.recordEntry({
    boardId,
    difficulty: state.difficulty,
    seconds,
    solvedAt,
    date: currentEntry.date
  });
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

const syncControlsLockToStorage = () => {
  storage.controlsLocked = state.controlsLocked;
};

const getControlsLockLabel = () =>
  translate(state.controlsLocked ? 'actionUnlockControls' : 'actionLockControls');

const getRegionFillToggleLabel = () =>
  translate(state.regionFillEnabled ? 'actionHideRegionColors' : 'actionShowRegionColors');

const updateRegionFillState = ({ persist = false } = {}) => {
  const enabled = Boolean(state.regionFillEnabled);

  if (appRoot) {
    appRoot.dataset.regionFill = enabled ? 'true' : 'false';
  }

  if (regionFillToggleButton) {
    regionFillToggleButton.setAttribute('aria-pressed', String(enabled));
    regionFillToggleButton.dataset.active = enabled ? 'true' : 'false';
    const label = getRegionFillToggleLabel();
    regionFillToggleButton.setAttribute('aria-label', label);
    regionFillToggleButton.setAttribute('title', label);
  }

  if (persist) {
    storage.regionFillEnabled = enabled;
    writeStorage(storage);
  }
};

const updateControlsLockState = () => {
  const locked = Boolean(state.controlsLocked);

  if (testButton) {
    testButton.disabled = locked;
    if (locked) {
      testButton.dataset.locked = 'true';
    } else {
      delete testButton.dataset.locked;
    }
  }

  if (clearButton) {
    clearButton.disabled = locked;
  }

  if (resetProgressButton) {
    resetProgressButton.disabled = locked;
  }

  if (lockControlsButton) {
    lockControlsButton.setAttribute('aria-pressed', String(locked));
    lockControlsButton.dataset.locked = locked ? 'true' : 'false';
    const label = getControlsLockLabel();
    lockControlsButton.setAttribute('aria-label', label);
    lockControlsButton.setAttribute('title', label);
  }

  postScoreController?.updateButtonState();
};

const setControlsLocked = (locked) => {
  state.controlsLocked = Boolean(locked);
  syncControlsLockToStorage();
  updateControlsLockState();
  writeStorage(storage);
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
  storage.controlsLocked = state.controlsLocked;
  currentEntry = null;
  state.difficulty = DEFAULT_DIFFICULTY;
  state.puzzle = null;
  state.boardState = [];
  state.isSolved = false;
  postScoreController?.updateButtonState();
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
  leaderboardController?.render();
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

const hasBoardProgress = () =>
  state.boardState.some((row) => row.some((cell) => cell !== 'empty'));

const resumeTimerIfNeeded = () => {
  if (state.timer.running) {
    return;
  }
  if (state.isSolved || currentEntry?.solved) {
    return;
  }
  if (state.timer.secondsElapsed > 0 || hasBoardProgress()) {
    startTimer();
  }
};

const loadPuzzle = ({ difficulty = state.difficulty, forceNew = false } = {}) => {
  const puzzles = ensurePuzzlesStorage();
  const todayKey = getTodayKey();
  let entry = puzzles[difficulty];

  if (!entry || entry.date !== todayKey || forceNew) {
    const paletteColors = getPaletteColorsById(activeColorPaletteId);
    const puzzle = createPuzzle(difficulty, paletteColors);
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
  syncControlsLockToStorage();

  currentEntry = entry;
  state.difficulty = difficulty;
  setAppDifficultyAttribute(difficulty);
  state.puzzle = entry.puzzle;
  applyActivePaletteToPuzzle(state.puzzle);
  state.boardState = cloneBoard(entry.boardState);
  state.isSolved = Boolean(entry.solved);
  if (currentEntry && !Object.prototype.hasOwnProperty.call(currentEntry, 'status')) {
    currentEntry.status = null;
  }
  resetTimer(entry.secondsElapsed || 0);
  postScoreController?.updateButtonState();
  writeStorage(storage);
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
  updateControlsLockState();
  updateExtremeAvailability();
  updateDifficultyButtons();
  applyPaletteToBoardElements();
  const stateToPersist =
    additionalState || (announce && statusDetails ? { status: statusDetails } : undefined);
  postScoreController?.updateButtonState();
  persistCurrentState(stateToPersist);
  resumeTimerIfNeeded();
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
  const content = element._contentElement || element.querySelector('.cell__content');
  element.dataset.state = stateValue;
  if (!content) {
    return;
  }
  if (stateValue === 'fruit') {
    content.textContent = '★';
  } else if (stateValue === 'mark') {
    content.textContent = '×';
  } else {
    content.textContent = '';
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
    postScoreController?.updateButtonState();
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
  postScoreController?.updateButtonState();
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
      button.style.setProperty(
        '--region-fill-color',
        computeRegionFillColor(region.color, REGION_FILL_OPACITY)
      );
      const content = document.createElement('span');
      content.className = 'cell__content';
      content.setAttribute('aria-hidden', 'true');
      button.appendChild(content);
      button._contentElement = content;
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
    const alreadySolved = Boolean(currentEntry?.solved);
    stopTimer();
    state.isSolved = true;
    updateTimerLockState();
    postScoreController?.updateButtonState();
    const solvedMessage = translate('statusSolved');
    updateStatus('success', solvedMessage);
    if (!alreadySolved) {
      recordLeaderboardEntry();
    }
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
    postScoreController?.updateButtonState();
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
  if (difficulty === 'extreme' && !isExtremeDifficultyUnlocked()) {
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
clearButton.addEventListener('click', () => {
  if (state.controlsLocked) {
    return;
  }
  resetBoard();
});
difficultyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setDifficulty(button.dataset.difficulty);
  });
});

if (lockControlsButton) {
  lockControlsButton.addEventListener('click', () => {
    setControlsLocked(!state.controlsLocked);
  });
}

if (regionFillToggleButton) {
  regionFillToggleButton.addEventListener('click', () => {
    state.regionFillEnabled = !state.regionFillEnabled;
    updateRegionFillState({ persist: true });
  });
}

if (testButton) {
  testButton.addEventListener('click', () => {
    if (state.controlsLocked) {
      return;
    }
    newPuzzle({ announce: true, forceNew: true });
  });
}

if (resetProgressButton) {
  resetProgressButton.addEventListener('click', () => {
    if (state.controlsLocked) {
      return;
    }
    resetProgress();
  });
}

leaderboardController = createLeaderboardManager({
  state,
  translate,
  difficulties: DIFFICULTIES,
  formatTime,
  formatScoreValue,
  getStorage: () => storage,
  writeStorage,
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    table: SUPABASE_LEADERBOARD_TABLE
  },
  elements: {
    button: leaderboardButton,
    overlay: leaderboardOverlay,
    list: leaderboardList,
    emptyState: leaderboardEmptyState,
    tabs: leaderboardTabs,
    globalList: leaderboardGlobalList,
    globalEmptyState: leaderboardGlobalEmptyState,
    globalLoading: leaderboardGlobalLoading,
    closeButton: leaderboardCloseButton,
    titleElement: leaderboardTitleElement
  }
});

postScoreController = createPostScoreController({
  state,
  translate,
  formatTime,
  formatScoreValue,
  difficulties: DIFFICULTIES,
  getStorage: () => storage,
  writeStorage,
  submitScore: leaderboardController.submitScoreToGlobalLeaderboard,
  updateStatus,
  onGlobalLeaderboardRefresh: (options) =>
    leaderboardController.loadGlobalLeaderboard(options),
  locale: ACTIVE_LOCALE,
  canSubmitToGlobalLeaderboard: () =>
    Boolean(leaderboardController?.hasSupabaseConfiguration?.()),
  elements: {
    button: postScoreButton,
    overlay: postScoreOverlay,
    form: postScoreForm,
    input: postScoreInput,
    scoreElement: postScoreScoreElement,
    submitButton: postScoreSubmitButton,
    cancelButton: postScoreCancelButton,
    titleElement: postScoreTitleElement,
    descriptionElement: postScoreDescriptionElement,
    scoreLabelElement: postScoreScoreLabelElement
  }
});

postScoreController.updateButtonState();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (postScoreController?.isOpen()) {
      if (state.postScoreSubmitting) {
        return;
      }
      event.preventDefault();
      postScoreController.close();
      return;
    }
    if (leaderboardController?.isOpen()) {
      event.preventDefault();
      leaderboardController.close();
    }
  }
});

const initializeApp = () => {
  applyTranslations();
  updateControlsLockState();
  updateRegionFillState();
  const storedDifficulty = storage.difficulty;
  if (storedDifficulty && DIFFICULTIES[storedDifficulty]) {
    state.difficulty = storedDifficulty;
  }
  loadPuzzle({ difficulty: state.difficulty, forceNew: false });
  renderCurrentPuzzle({ announce: false });
  leaderboardController?.setView(state.leaderboardView);
};

initializeApp();
