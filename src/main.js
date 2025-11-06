import { ACTIVE_LOCALE, translate } from './config/translations.js';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from './config/difficulties.js';
import {
  COLOR_PALETTES,
  COLOR_PALETTE_MAP,
  DEFAULT_COLOR_PALETTE_ID,
  PALETTE_ORDER,
  getPaletteById,
  getPaletteColorsById,
  getPalettePreviewGradient
} from './palette.js';
import { CELL_STATES, createEmptyBoard, createPuzzle } from './puzzle.js';
import { cloneBoard } from './utils/board.js';
import {
  STORAGE_KEY,
  getTimestamp,
  getTodayKey,
  readStorage,
  writeStorage
} from './storage.js';

const MAX_LEADERBOARD_ENTRIES = 20;

let activeColorPaletteId = DEFAULT_COLOR_PALETTE_ID;

const getActiveColorPalette = () => getPaletteById(activeColorPaletteId);

let storage = readStorage();
if (typeof storage.controlsLocked !== 'boolean') {
  storage.controlsLocked = false;
}
if (typeof storage.colorPalette === 'string' && COLOR_PALETTE_MAP[storage.colorPalette]) {
  activeColorPaletteId = storage.colorPalette;
} else {
  storage.colorPalette = activeColorPaletteId;
}
let currentEntry = null;

const state = {
  difficulty: DEFAULT_DIFFICULTY,
  puzzle: null,
  boardState: [],
  isSolved: false,
  controlsLocked: Boolean(storage.controlsLocked),
  colorPalette: activeColorPaletteId,
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
const lockControlsButton = document.getElementById('lock-controls-button');
const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-option'));
const extremeDifficultyButton = difficultyButtons.find(
  (button) => button.dataset.difficulty === 'extreme'
);
const footerDescriptionElement = document.getElementById('footer-description');
const colorPalettePicker = document.getElementById('color-palette-picker');
const colorPaletteButton = document.getElementById('color-palette-button');
const colorPaletteButtonLabel = document.getElementById('color-palette-button-label');
const colorPaletteMenu = document.getElementById('color-palette-menu');
const resetProgressButton = document.getElementById('reset-progress-button');
const leaderboardButton = document.getElementById('leaderboard-button');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardEmptyState = document.getElementById('leaderboard-empty-state');
const leaderboardCloseButton = document.getElementById('leaderboard-close-button');
const leaderboardTitleElement = document.getElementById('leaderboard-title');

let lastFocusedElementBeforeLeaderboard = null;

const columnHintElements = [];
const rowHintElements = [];
const cellElements = [];
const colorPaletteOptionElements = new Map();
let isColorPaletteMenuOpen = false;

const updateColorPaletteButtonAppearance = () => {
  if (!colorPaletteButton) {
    return;
  }
  const preview = getPalettePreviewGradient(getActiveColorPalette());
  colorPaletteButton.style.setProperty('--palette-preview', preview);
};

const updateColorPaletteButtonExpandedState = () => {
  if (colorPaletteButton) {
    colorPaletteButton.setAttribute('aria-expanded', String(isColorPaletteMenuOpen));
  }
};

const updateColorPaletteButtonLabel = () => {
  if (!colorPaletteButton) {
    return;
  }
  const baseLabel = translate('actionColorPalette');
  const palette = getActiveColorPalette();
  const label = palette ? `${baseLabel} (${palette.name})` : baseLabel;
  colorPaletteButton.setAttribute('aria-label', label);
  colorPaletteButton.setAttribute('title', label);
  if (colorPaletteButtonLabel) {
    colorPaletteButtonLabel.textContent = baseLabel;
  }
};

const updateColorPaletteMenuSelection = () => {
  colorPaletteOptionElements.forEach((element, paletteId) => {
    const isSelected = paletteId === activeColorPaletteId;
    if (isSelected) {
      element.dataset.selected = 'true';
      element.setAttribute('tabindex', '0');
    } else {
      delete element.dataset.selected;
      element.setAttribute('tabindex', '-1');
    }
    element.setAttribute('aria-checked', String(isSelected));
  });
};

const buildColorPaletteMenu = () => {
  if (!colorPaletteMenu) {
    return;
  }
  colorPaletteMenu.innerHTML = '';
  colorPaletteOptionElements.clear();
  COLOR_PALETTES.forEach((palette) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'color-palette-option';
    option.dataset.paletteId = palette.id;
    option.setAttribute('role', 'menuitemradio');
    option.setAttribute('aria-label', palette.name);
    option.title = palette.name;
    option.style.setProperty('--palette-preview', getPalettePreviewGradient(palette));
    option.setAttribute('tabindex', palette.id === activeColorPaletteId ? '0' : '-1');
    option.setAttribute('aria-checked', palette.id === activeColorPaletteId ? 'true' : 'false');
    if (palette.id === activeColorPaletteId) {
      option.dataset.selected = 'true';
    }
    colorPaletteMenu.appendChild(option);
    colorPaletteOptionElements.set(palette.id, option);
  });
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
      }
    }
  }
};

if (colorPaletteMenu) {
  colorPaletteMenu.hidden = true;
}

const openColorPaletteMenu = () => {
  if (!colorPaletteMenu || !colorPaletteButton || colorPaletteButton.disabled || isColorPaletteMenuOpen) {
    return;
  }
  colorPaletteMenu.hidden = false;
  isColorPaletteMenuOpen = true;
  updateColorPaletteButtonExpandedState();
  updateColorPaletteMenuSelection();
  const selected = colorPaletteOptionElements.get(activeColorPaletteId);
  const focusTarget = selected || colorPaletteMenu.querySelector('button');
  window.requestAnimationFrame(() => {
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
  });
};

const closeColorPaletteMenu = ({ focusButton = false } = {}) => {
  if (!colorPaletteMenu || !isColorPaletteMenuOpen) {
    return;
  }
  isColorPaletteMenuOpen = false;
  colorPaletteMenu.hidden = true;
  updateColorPaletteButtonExpandedState();
  if (focusButton && colorPaletteButton && typeof colorPaletteButton.focus === 'function') {
    colorPaletteButton.focus();
  }
};

const focusPaletteOptionByIndex = (index) => {
  if (index < 0 || index >= PALETTE_ORDER.length) {
    return;
  }
  const paletteId = PALETTE_ORDER[index];
  const element = colorPaletteOptionElements.get(paletteId);
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
};

const handleColorPaletteMenuKeyDown = (event) => {
  if (!isColorPaletteMenuOpen) {
    return;
  }
  const { key } = event;
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    event.preventDefault();
    const current = document.activeElement;
    let index = PALETTE_ORDER.findIndex(
      (paletteId) => colorPaletteOptionElements.get(paletteId) === current
    );
    if (index === -1) {
      index = PALETTE_ORDER.findIndex((paletteId) => paletteId === activeColorPaletteId);
    }
    const nextIndex = (index + 1) % PALETTE_ORDER.length;
    focusPaletteOptionByIndex(nextIndex);
    return;
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    event.preventDefault();
    const current = document.activeElement;
    let index = PALETTE_ORDER.findIndex(
      (paletteId) => colorPaletteOptionElements.get(paletteId) === current
    );
    if (index === -1) {
      index = PALETTE_ORDER.findIndex((paletteId) => paletteId === activeColorPaletteId);
    }
    const nextIndex = (index - 1 + PALETTE_ORDER.length) % PALETTE_ORDER.length;
    focusPaletteOptionByIndex(nextIndex);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    focusPaletteOptionByIndex(0);
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    focusPaletteOptionByIndex(PALETTE_ORDER.length - 1);
    return;
  }
};

const setColorPalette = (paletteId) => {
  if (!COLOR_PALETTE_MAP[paletteId]) {
    paletteId = DEFAULT_COLOR_PALETTE_ID;
  }
  if (activeColorPaletteId === paletteId) {
    updateColorPaletteMenuSelection();
    return;
  }
  activeColorPaletteId = paletteId;
  state.colorPalette = paletteId;
  storage.colorPalette = paletteId;
  updateColorPaletteButtonAppearance();
  updateColorPaletteButtonLabel();
  updateColorPaletteMenuSelection();
  applyActivePaletteToPuzzle(state.puzzle);
  applyPaletteToBoardElements();
  if (currentEntry) {
    persistCurrentState();
  } else {
    writeStorage(storage);
  }
};

const ensurePuzzlesStorage = () => {
  if (!storage.puzzles || typeof storage.puzzles !== 'object') {
    storage.puzzles = {};
  }
  return storage.puzzles;
};

const ensureLeaderboardStorage = () => {
  if (!Array.isArray(storage.leaderboard)) {
    storage.leaderboard = [];
  }
  return storage.leaderboard;
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

  if (leaderboardButton) {
    const label = translate('actionLeaderboard');
    leaderboardButton.setAttribute('aria-label', label);
    leaderboardButton.setAttribute('title', label);
  }

  if (leaderboardTitleElement) {
    leaderboardTitleElement.textContent = translate('leaderboardTitle');
  }

  if (leaderboardEmptyState) {
    leaderboardEmptyState.textContent = translate('leaderboardEmpty');
  }

  if (leaderboardCloseButton) {
    leaderboardCloseButton.setAttribute('aria-label', translate('actionCloseLeaderboard'));
  }

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
  if (colorPaletteMenu) {
    colorPaletteMenu.setAttribute('aria-label', translate('colorPaletteMenuLabel'));
  }
  updateColorPaletteButtonLabel();

  if (resetProgressButton) {
    const label = translate('actionResetProgress');
    resetProgressButton.setAttribute('aria-label', label);
    resetProgressButton.setAttribute('title', label);
  }
};

const persistCurrentState = (additional = {}) => {
  storage.colorPalette = activeColorPaletteId;
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

const formatTime = (seconds) => {
  const totalSeconds = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const getDifficultyLabel = (difficulty) => {
  const config = DIFFICULTIES[difficulty];
  if (config?.labelKey) {
    return translate(config.labelKey);
  }
  if (typeof difficulty === 'string' && difficulty.length > 0) {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }
  return translate('difficultyLabel');
};

const getLeaderboardEntries = () => {
  const entries = ensureLeaderboardStorage();
  return entries
    .filter((entry) => entry && typeof entry === 'object')
    .slice()
    .sort((a, b) => {
      const aSeconds = Number.isFinite(a.seconds) ? a.seconds : Number.MAX_SAFE_INTEGER;
      const bSeconds = Number.isFinite(b.seconds) ? b.seconds : Number.MAX_SAFE_INTEGER;
      if (aSeconds === bSeconds) {
        return (a.solvedAt || '').localeCompare(b.solvedAt || '');
      }
      return aSeconds - bSeconds;
    });
};

const renderLeaderboard = () => {
  if (!leaderboardList || !leaderboardEmptyState) {
    return;
  }

  const entries = getLeaderboardEntries();
  leaderboardList.innerHTML = '';

  if (!entries.length) {
    leaderboardList.hidden = true;
    leaderboardEmptyState.hidden = false;
    return;
  }

  leaderboardEmptyState.hidden = true;
  leaderboardList.hidden = false;

  entries.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-list__item';

    const rank = document.createElement('span');
    rank.className = 'leaderboard-list__rank';
    rank.textContent = String(index + 1);
    item.appendChild(rank);

    const details = document.createElement('div');
    details.className = 'leaderboard-list__details';

    const difficulty = document.createElement('span');
    difficulty.className = 'leaderboard-list__difficulty';
    difficulty.textContent = getDifficultyLabel(entry.difficulty);

    const time = document.createElement('span');
    time.className = 'leaderboard-list__time';
    time.textContent = formatTime(entry.seconds);

    details.appendChild(difficulty);
    details.appendChild(time);
    item.appendChild(details);

    leaderboardList.appendChild(item);
  });
};

const recordLeaderboardEntry = () => {
  if (!currentEntry) {
    return;
  }

  const leaderboard = ensureLeaderboardStorage();
  const boardId = currentEntry.createdAt || `${state.difficulty}-${currentEntry.date || getTimestamp()}`;
  const seconds = state.timer.secondsElapsed;
  const solvedAt = getTimestamp();

  const newEntry = {
    boardId,
    difficulty: state.difficulty,
    seconds,
    solvedAt,
    date: currentEntry.date
  };

  const existingIndex = leaderboard.findIndex((entry) => entry.boardId === boardId);

  if (existingIndex >= 0) {
    const existing = leaderboard[existingIndex];
    if (!Number.isFinite(existing.seconds) || seconds < existing.seconds) {
      leaderboard[existingIndex] = newEntry;
    } else {
      leaderboard[existingIndex] = { ...existing, solvedAt };
    }
  } else {
    leaderboard.push(newEntry);
  }

  leaderboard.sort((a, b) => {
    const aSeconds = Number.isFinite(a.seconds) ? a.seconds : Number.MAX_SAFE_INTEGER;
    const bSeconds = Number.isFinite(b.seconds) ? b.seconds : Number.MAX_SAFE_INTEGER;
    if (aSeconds === bSeconds) {
      return (a.solvedAt || '').localeCompare(b.solvedAt || '');
    }
    return aSeconds - bSeconds;
  });

  if (leaderboard.length > MAX_LEADERBOARD_ENTRIES) {
    leaderboard.length = MAX_LEADERBOARD_ENTRIES;
  }

  writeStorage(storage);
  renderLeaderboard();
};

const isLeaderboardOpen = () => Boolean(leaderboardOverlay && !leaderboardOverlay.hidden);

const openLeaderboard = () => {
  if (!leaderboardOverlay) {
    return;
  }
  renderLeaderboard();
  lastFocusedElementBeforeLeaderboard =
    document.activeElement && typeof document.activeElement.focus === 'function'
      ? document.activeElement
      : null;
  leaderboardOverlay.hidden = false;
  leaderboardOverlay.setAttribute('data-open', 'true');
  if (leaderboardCloseButton) {
    window.setTimeout(() => {
      leaderboardCloseButton.focus();
    }, 0);
  }
};

const closeLeaderboard = () => {
  if (!leaderboardOverlay) {
    return;
  }
  leaderboardOverlay.hidden = true;
  leaderboardOverlay.removeAttribute('data-open');
  if (lastFocusedElementBeforeLeaderboard && typeof lastFocusedElementBeforeLeaderboard.focus === 'function') {
    lastFocusedElementBeforeLeaderboard.focus();
  }
  lastFocusedElementBeforeLeaderboard = null;
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

  if (colorPaletteButton) {
    colorPaletteButton.disabled = locked;
    if (locked) {
      closeColorPaletteMenu();
    }
  }

  if (lockControlsButton) {
    lockControlsButton.setAttribute('aria-pressed', String(locked));
    lockControlsButton.dataset.locked = locked ? 'true' : 'false';
    const label = getControlsLockLabel();
    lockControlsButton.setAttribute('aria-label', label);
    lockControlsButton.setAttribute('title', label);
  }

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
  storage.colorPalette = activeColorPaletteId;
  currentEntry = null;
  state.difficulty = DEFAULT_DIFFICULTY;
  state.puzzle = null;
  state.boardState = [];
  state.isSolved = false;
  state.colorPalette = activeColorPaletteId;
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
  renderLeaderboard();
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
  state.colorPalette = activeColorPaletteId;
  state.boardState = cloneBoard(entry.boardState);
  state.isSolved = Boolean(entry.solved);
  if (currentEntry && !Object.prototype.hasOwnProperty.call(currentEntry, 'status')) {
    currentEntry.status = null;
  }
  resetTimer(entry.secondsElapsed || 0);
  storage.colorPalette = activeColorPaletteId;
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
    const alreadySolved = Boolean(currentEntry?.solved);
    stopTimer();
    state.isSolved = true;
    updateTimerLockState();
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

buildColorPaletteMenu();
updateColorPaletteButtonAppearance();
updateColorPaletteMenuSelection();
updateColorPaletteButtonExpandedState();

if (colorPaletteButton) {
  colorPaletteButton.addEventListener('click', () => {
    if (isColorPaletteMenuOpen) {
      closeColorPaletteMenu();
    } else {
      openColorPaletteMenu();
    }
  });
  colorPaletteButton.addEventListener('keydown', (event) => {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'Space' ||
      event.key === 'Spacebar' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      openColorPaletteMenu();
    }
  });
}

if (colorPaletteMenu) {
  colorPaletteMenu.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('.color-palette-option') : null;
    if (!target) {
      return;
    }
    event.preventDefault();
    const paletteId = target.dataset.paletteId;
    setColorPalette(paletteId);
  });
  colorPaletteMenu.addEventListener('keydown', handleColorPaletteMenuKeyDown);
}

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

if (leaderboardButton) {
  leaderboardButton.addEventListener('click', () => {
    openLeaderboard();
  });
}

if (leaderboardCloseButton) {
  leaderboardCloseButton.addEventListener('click', () => {
    closeLeaderboard();
  });
}

if (leaderboardOverlay) {
  leaderboardOverlay.addEventListener('click', (event) => {
    if (event.target === leaderboardOverlay) {
      closeLeaderboard();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (isLeaderboardOpen()) {
      event.preventDefault();
      closeLeaderboard();
    }
  }
});

const initializeApp = () => {
  applyTranslations();
  updateControlsLockState();
  const storedDifficulty = storage.difficulty;
  if (storedDifficulty && DIFFICULTIES[storedDifficulty]) {
    state.difficulty = storedDifficulty;
  }
  loadPuzzle({ difficulty: state.difficulty, forceNew: false });
  renderCurrentPuzzle({ announce: false });
  renderLeaderboard();
};

initializeApp();
