import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../config/difficulties.js';
import { DEFAULT_GAME_TYPE } from '../config/games.js';
import {
  ensurePuzzlesStorage,
  getGameScopedStorageKey,
  normalizeGameType,
  persistStorage,
  storage
} from './storageHelpers.js';

export const GAME_SPECIFIC_DIFFICULTIES = {
  gears: ['easy', 'normal', 'hard']
};

export const getAllowedDifficultiesForGame = (gameType = DEFAULT_GAME_TYPE) => {
  const specific = GAME_SPECIFIC_DIFFICULTIES[gameType];
  if (Array.isArray(specific) && specific.length > 0) {
    return specific;
  }
  return Object.keys(DIFFICULTIES);
};

const selectFallbackDifficulty = (allowed) => {
  if (allowed.includes(DEFAULT_DIFFICULTY) && DEFAULT_DIFFICULTY !== 'extreme') {
    return DEFAULT_DIFFICULTY;
  }
  const firstNonExtreme = allowed.find((value) => value !== 'extreme');
  return firstNonExtreme || allowed[0] || DEFAULT_DIFFICULTY;
};

export const getDifficultyStorageKey = (gameType = DEFAULT_GAME_TYPE) =>
  getGameScopedStorageKey('difficulty', gameType);

export const readStoredDifficultyForGame = (gameType = DEFAULT_GAME_TYPE) => {
  const key = getDifficultyStorageKey(gameType);
  const storedValue = storage[key];
  if (typeof storedValue === 'string' && DIFFICULTIES[storedValue]) {
    return storedValue;
  }
  return DEFAULT_DIFFICULTY;
};

export const markExtremeUnlocked = () => {
  if (!storage.extremeUnlocked) {
    storage.extremeUnlocked = true;
    persistStorage();
  }
};

export const isExtremeDifficultyUnlocked = (gameType = DEFAULT_GAME_TYPE) => {
  const normalizedGameType = normalizeGameType(gameType);
  if (normalizedGameType !== 'stars') {
    return false;
  }

  if (storage.extremeUnlocked) {
    return true;
  }

  const puzzles = ensurePuzzlesStorage('stars');
  const hardEntry = puzzles.hard;
  if (hardEntry?.solved) {
    markExtremeUnlocked();
    return true;
  }

  return false;
};

export const normalizeDifficultyForGame = (
  difficulty,
  gameType = DEFAULT_GAME_TYPE,
  isExtremeUnlocked = isExtremeDifficultyUnlocked
) => {
  const normalizedGameType = normalizeGameType(gameType);
  const allowed = getAllowedDifficultiesForGame(normalizedGameType);
  const extremeUnlocked = isExtremeUnlocked(normalizedGameType);
  const candidate = allowed.includes(difficulty) ? difficulty : null;

  if (candidate === 'extreme' && !extremeUnlocked) {
    return selectFallbackDifficulty(allowed);
  }

  if (candidate) {
    return candidate;
  }

  return selectFallbackDifficulty(allowed);
};
