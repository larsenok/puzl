import { DEFAULT_GAME_TYPE } from '../config/games.js';
import { readStorage, writeStorage } from '../storage.js';

export const storage = readStorage();

if (typeof storage.controlsLocked !== 'boolean') {
  storage.controlsLocked = false;
}

if (typeof storage.regionFillEnabled !== 'boolean') {
  storage.regionFillEnabled = true;
}

if (typeof storage.shapesViewActive !== 'boolean') {
  storage.shapesViewActive = false;
}

export const persistStorage = () => writeStorage(storage);

export const normalizeGameType = () => DEFAULT_GAME_TYPE;

export const getGameScopedStorageKey = (baseKey, gameType = DEFAULT_GAME_TYPE) =>
  gameType === DEFAULT_GAME_TYPE ? baseKey : `${baseKey}_${gameType}`;

export const ensurePuzzlesStorage = (gameType = DEFAULT_GAME_TYPE) => {
  const key = getGameScopedStorageKey('puzzles', gameType);
  if (!storage[key] || typeof storage[key] !== 'object') {
    storage[key] = {};
  }
  return storage[key];
};

export const resetStorage = () => {
  const fresh = readStorage();
  Object.keys(storage).forEach((key) => delete storage[key]);
  Object.assign(storage, fresh);

  if (typeof storage.controlsLocked !== 'boolean') {
    storage.controlsLocked = false;
  }

  if (typeof storage.regionFillEnabled !== 'boolean') {
    storage.regionFillEnabled = true;
  }

  if (typeof storage.shapesViewActive !== 'boolean') {
    storage.shapesViewActive = false;
  }

  return storage;
};
