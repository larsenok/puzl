import { DEFAULT_GAME_TYPE } from '../config/games.js';
import { getTimestamp, getTodayKey, writeStorage } from '../storage.js';
import { getGameScopedStorageKey, storage } from './storageHelpers.js';

const MAX_TRACKED_POSTED_ENTRIES = 50;

const createLocalRecordId = () =>
  `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const resolvePostedEntryIdentity = (entry) => {
  const idFromEntry = typeof entry?.id === 'string' && entry.id.trim().length > 0
    ? entry.id.trim()
    : null;
  const boardId =
    typeof entry?.boardId === 'string' && entry.boardId.trim().length > 0
      ? entry.boardId.trim()
      : null;

  return {
    id: idFromEntry || boardId || createLocalRecordId(),
    boardId
  };
};

const normalizePostedEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const { id, boardId } = resolvePostedEntryIdentity(entry);
  const normalizedDifficulty =
    typeof entry.difficulty === 'string' ? entry.difficulty.trim() : '';
  const difficulty = normalizedDifficulty.length > 0 ? normalizedDifficulty : null;
  const numericSeconds = Number(entry.seconds);
  const seconds = Number.isFinite(numericSeconds) ? numericSeconds : null;
  const solvedAt =
    typeof entry.solvedAt === 'string' && entry.solvedAt.trim().length > 0
      ? entry.solvedAt.trim()
      : null;

  if (!boardId && (!difficulty || seconds === null)) {
    return null;
  }

  return {
    id,
    boardId,
    difficulty,
    seconds,
    solvedAt
  };
};

const postedEntriesMatch = (a, b) => {
  if (!a || !b) {
    return false;
  }

  const aId = typeof a.id === 'string' && a.id.trim().length > 0 ? a.id.trim() : null;
  const bId = typeof b.id === 'string' && b.id.trim().length > 0 ? b.id.trim() : null;

  if (aId && bId) {
    return aId === bId;
  }

  if (a.boardId && b.boardId) {
    if (a.boardId !== b.boardId) {
      return false;
    }

    const aSeconds = Number.isFinite(a.seconds) ? a.seconds : null;
    const bSeconds = Number.isFinite(b.seconds) ? b.seconds : null;

    if (aSeconds !== null && bSeconds !== null && aSeconds !== bSeconds) {
      return false;
    }

    const aDifficulty = a.difficulty || null;
    const bDifficulty = b.difficulty || null;

    if (aDifficulty && bDifficulty && aDifficulty !== bDifficulty) {
      return false;
    }

    if (aSeconds === null || bSeconds === null) {
      return aDifficulty === bDifficulty;
    }

    return aDifficulty === bDifficulty;
  }

  const aSeconds = Number.isFinite(a.seconds) ? a.seconds : null;
  const bSeconds = Number.isFinite(b.seconds) ? b.seconds : null;

  if (aSeconds === null || bSeconds === null) {
    return false;
  }

  return (
    aSeconds === bSeconds &&
    (a.difficulty || null) === (b.difficulty || null) &&
    (a.solvedAt || null) === (b.solvedAt || null)
  );
};

export const readPostedGlobalEntries = (gameType = DEFAULT_GAME_TYPE) => {
  const key = getGameScopedStorageKey('globalLeaderboardPostedEntries', gameType);
  const entries = storage[key];
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => normalizePostedEntry(entry)).filter(Boolean);
};

export const hasPostedGlobalEntry = ({
  id,
  boardId,
  difficulty,
  seconds,
  solvedAt,
  gameType = DEFAULT_GAME_TYPE
}) => {
  const candidate = normalizePostedEntry({ id, boardId, difficulty, seconds, solvedAt });
  if (!candidate) {
    return false;
  }

  return readPostedGlobalEntries(gameType).some((entry) => postedEntriesMatch(entry, candidate));
};

export const readLastPostedScore = (gameType = DEFAULT_GAME_TYPE) => {
  const key = getGameScopedStorageKey('globalLeaderboardLastPostedScore', gameType);
  const value = Number(storage[key]);
  return Number.isFinite(value) ? value : null;
};

export const readLastPostedEntryForBoard = (boardId, gameType = DEFAULT_GAME_TYPE) => {
  if (typeof boardId !== 'string' || boardId.trim().length === 0) {
    return null;
  }

  const normalizedBoardId = boardId.trim();
  return (
    readPostedGlobalEntries(gameType).find((entry) => entry.boardId === normalizedBoardId) || null
  );
};

export const readLastPostedEntryMeta = (gameType = DEFAULT_GAME_TYPE) => {
  const key = getGameScopedStorageKey('globalLeaderboardLastPostedEntry', gameType);
  const entry = storage[key];
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const difficulty =
    typeof entry.difficulty === 'string' && entry.difficulty.trim().length > 0
      ? entry.difficulty.trim()
      : null;
  const score = Number(entry.score);
  const seconds = Number(entry.seconds);

  return {
    difficulty,
    score: Number.isFinite(score) ? score : null,
    seconds: Number.isFinite(seconds) ? seconds : null
  };
};

export const writeLastPostedScore = (score, gameType = DEFAULT_GAME_TYPE) => {
  const key = getGameScopedStorageKey('globalLeaderboardLastPostedScore', gameType);
  if (Number.isFinite(score)) {
    storage[key] = Number(score);
  } else {
    delete storage[key];
  }
};

export const writeLastPostedEntryMeta = (entry, gameType = DEFAULT_GAME_TYPE) => {
  const key = getGameScopedStorageKey('globalLeaderboardLastPostedEntry', gameType);
  if (!entry || typeof entry !== 'object') {
    delete storage[key];
    return;
  }

  const difficulty =
    typeof entry.difficulty === 'string' && entry.difficulty.trim().length > 0
      ? entry.difficulty.trim()
      : null;
  const score = Number(entry.score);
  const seconds = Number(entry.seconds);

  storage[key] = {
    difficulty,
    score: Number.isFinite(score) ? score : null,
    seconds: Number.isFinite(seconds) ? seconds : null
  };
};

export const recordPostedGlobalEntry = ({
  id,
  boardId,
  difficulty,
  seconds,
  solvedAt,
  score,
  gameType = DEFAULT_GAME_TYPE
}) => {
  const candidate = normalizePostedEntry({ id, boardId, difficulty, seconds, solvedAt });
  if (!candidate) {
    return;
  }

  const entries = readPostedGlobalEntries(gameType);
  if (entries.some((entry) => postedEntriesMatch(entry, candidate))) {
    return;
  }

  entries.unshift(candidate);
  const key = getGameScopedStorageKey('globalLeaderboardPostedEntries', gameType);
  storage[key] = entries.slice(0, MAX_TRACKED_POSTED_ENTRIES);

  writeLastPostedScore(score, gameType);
  writeLastPostedEntryMeta({ difficulty: candidate.difficulty, seconds, score }, gameType);

  writeStorage(storage);
};

export const updateTodayStats = (
  { solvedSuccessfully, recordFailure, recordSuccess },
  state,
  gameType = DEFAULT_GAME_TYPE
) => {
  const todayKey = getTodayKey();
  if (!state.stats[todayKey]) {
    state.stats[todayKey] = {
      failures: 0,
      successes: 0,
      type: gameType
    };
  }

  if (state.isSolved && solvedSuccessfully) {
    state.stats[todayKey].successes += 1;
    recordSuccess(gameType);
  } else if (!state.isSolved && recordFailure) {
    state.stats[todayKey].failures += 1;
    recordFailure(gameType);
  }
};

export const shouldPostScore = (state, score) => {
  const todayKey = getTodayKey();
  const lastPostTimestamp = state.lastPostAt ?? 0;
  const lastPostDate = state.lastPostDate ?? todayKey;

  const hasAttemptedRecently = Math.abs(lastPostTimestamp - getTimestamp()) < 10_000;
  const postedToday = lastPostDate === todayKey;

  if (hasAttemptedRecently || postedToday) {
    return false;
  }

  const lastPostedScore = readLastPostedScore(state.gameType);
  const lastPostedEntry = readLastPostedEntryForBoard(state.puzzle?.boardId, state.gameType);

  const hasPostedThisBoardScore = hasPostedGlobalEntry({
    boardId: state.puzzle?.boardId,
    seconds: state.timer.secondsElapsed,
    difficulty: state.difficulty,
    gameType: state.gameType
  });

  if (hasPostedThisBoardScore || (lastPostedScore && score <= lastPostedScore)) {
    return false;
  }

  const shouldSkipEqualTime =
    lastPostedEntry?.difficulty === state.difficulty &&
    lastPostedEntry?.seconds === state.timer.secondsElapsed;

  if (shouldSkipEqualTime) {
    return false;
  }

  return true;
};
