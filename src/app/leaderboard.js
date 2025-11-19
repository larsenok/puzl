import { computeDifficultyScore } from '../utils/score.js';
import { getTodayKey } from '../storage.js';

const MAX_LEADERBOARD_ENTRIES = 20;

const createSupabaseHelpers = ({ url, anonKey, table }) => {
  const hasConfiguration = () => {
    const validUrl = typeof url === 'string' && !url.includes('PLACEHOLDER');
    const validKey = typeof anonKey === 'string' && !anonKey.includes('PLACEHOLDER');
    const validTable = typeof table === 'string' && !table.includes('PLACEHOLDER');
    return Boolean(validUrl && validKey && validTable);
  };

  const buildUrl = (search) => `${url}/rest/v1/${table}${search ? `?${search}` : ''}`;

  const fetchEntries = async () => {
    if (!hasConfiguration()) {
      return [];
    }

    const search =
      `select=initials,seconds,difficulty,created_at&order=seconds.asc&limit=${MAX_LEADERBOARD_ENTRIES}`;
    const response = await fetch(buildUrl(search), {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch global leaderboard: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((entry) => ({
        initials: (entry.initials || '').toString().slice(0, 3),
        seconds: Number.isFinite(Number(entry.seconds)) ? Number(entry.seconds) : null,
        difficulty: entry.difficulty,
        createdAt: entry.created_at || entry.createdAt || null
      }))
      .filter((entry) => entry.initials)
      .sort((a, b) => {
        const aSeconds = Number.isFinite(a.seconds) ? a.seconds : Number.MAX_SAFE_INTEGER;
        const bSeconds = Number.isFinite(b.seconds) ? b.seconds : Number.MAX_SAFE_INTEGER;
        if (aSeconds === bSeconds) {
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        }
        return aSeconds - bSeconds;
      });
  };

  const submitScore = async ({ initials, seconds, difficulty }) => {
    if (!hasConfiguration()) {
      console.info('Supabase configuration missing. Skipping global submission.', {
        initials,
        seconds,
        difficulty
      });
      return { success: false, skipped: true };
    }

    const payload = {
      initials,
      seconds,
      difficulty,
      created_at: new Date().toISOString()
    };

    const response = await fetch(buildUrl(''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to submit score: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  };

  return { hasConfiguration, fetchEntries, submitScore };
};

export const createLeaderboardManager = ({
  state,
  translate,
  difficulties = {},
  formatTime,
  formatScoreValue,
  getStorage,
  writeStorage,
  supabase,
  elements,
  getGameType = () => 'stars'
}) => {
  const {
    button,
    overlay,
    localView,
    list,
    emptyState,
    localHeading,
    globalView,
    globalList,
    globalEmptyState,
    globalLoading,
    globalRefreshButton,
    globalHeading,
    closeButton,
    titleElement,
    viewToggle,
    sectionsContainer
  } = elements;

  const supabaseHelpers = createSupabaseHelpers(supabase);
  let lastFocusedElement = null;

  const resolveGameType = (override) => {
    if (typeof override === 'string' && override.trim().length > 0) {
      return override;
    }
    if (typeof getGameType === 'function') {
      const current = getGameType();
      if (typeof current === 'string' && current.trim().length > 0) {
        return current;
      }
    }
    return 'stars';
  };

  const getGameSpecificKey = (base, override) => {
    const type = resolveGameType(override);
    return type === 'stars' ? base : `${base}_${type}`;
  };

  const updateLeaderboardTitle = () => {
    if (!titleElement) {
      return;
    }
    titleElement.textContent = translate('leaderboardTitle');
  };

  const updateViewToggle = () => {
    const isGlobal = state.leaderboardView === 'global';
    const currentView = isGlobal ? 'global' : 'local';

    if (sectionsContainer) {
      sectionsContainer.setAttribute('data-view', currentView);
    }

    if (!viewToggle) {
      return;
    }
    const switchLabel = translate('leaderboardViewSwitchLabel');
    const localLabel = translate('leaderboardTabLocal');
    const globalLabel = translate('leaderboardTabGlobal');
    const localOption = viewToggle.querySelector('[data-option="local"]');
    const globalOption = viewToggle.querySelector('[data-option="global"]');

    if (localOption) {
      localOption.textContent = localLabel;
      localOption.classList.toggle('is-active', !isGlobal);
    }

    if (globalOption) {
      globalOption.textContent = globalLabel;
      globalOption.classList.toggle('is-active', isGlobal);
    }

    viewToggle.setAttribute('data-view', currentView);
    viewToggle.setAttribute('aria-pressed', isGlobal ? 'true' : 'false');
    viewToggle.setAttribute('aria-label', switchLabel);
    viewToggle.setAttribute('title', switchLabel);
  };

  const readGlobalCacheEntry = () => {
    const storage = getStorage();
    const cache = storage.globalLeaderboardCache;
    const type = resolveGameType();

    if (!cache) {
      return null;
    }

    if (Array.isArray(cache.entries) && type === 'stars') {
      return cache;
    }

    if (cache.entries && type !== 'stars') {
      return null;
    }

    const entry = cache[type];
    if (entry && Array.isArray(entry.entries)) {
      return entry;
    }

    return null;
  };

  const writeGlobalCacheEntry = (payload) => {
    const storage = getStorage();
    const type = resolveGameType();
    const cache = storage.globalLeaderboardCache;

    if (!cache || Array.isArray(cache.entries)) {
      if (type === 'stars') {
        storage.globalLeaderboardCache = payload;
        return;
      }
      const legacy = cache && Array.isArray(cache.entries) ? cache : null;
      storage.globalLeaderboardCache = {};
      if (legacy) {
        storage.globalLeaderboardCache.stars = legacy;
      }
    }

    storage.globalLeaderboardCache[type] = payload;
  };

  const getGlobalFetchDateKey = (override) =>
    getGameSpecificKey('globalLeaderboardLastFetchDate', override);

  const clearGlobalCacheForCurrentGame = () => {
    const storage = getStorage();
    const cache = storage.globalLeaderboardCache;
    const type = resolveGameType();
    if (!cache) {
      return;
    }
    if (Array.isArray(cache.entries) && type === 'stars') {
      delete storage.globalLeaderboardCache;
      return;
    }
    if (cache.entries && type !== 'stars') {
      return;
    }
    if (cache[type]) {
      delete cache[type];
    }
  };

  const hydrateGlobalLeaderboardFromCache = () => {
    if (!supabaseHelpers.hasConfiguration()) {
      return;
    }

    const cacheEntry = readGlobalCacheEntry();

    if (!cacheEntry) {
      return;
    }

    const hydratedEntries = cacheEntry.entries
      .map((entry) =>
        normalizeEntry({
          initials: (entry.initials || '').toString().slice(0, 3),
          seconds: Number.isFinite(Number(entry.seconds)) ? Number(entry.seconds) : null,
          difficulty: entry.difficulty,
          createdAt: entry.createdAt || entry.created_at || null,
          uploaded: true
        })
      )
      .filter((entry) => entry && entry.initials && entry.uploaded);

    hydratedEntries.sort(compareEntries);
    state.globalLeaderboard = hydratedEntries;

    const todayKey = getTodayKey();
    const storage = getStorage();
    state.globalLeaderboardLoaded = storage[getGlobalFetchDateKey()] === todayKey;
  };

  const ensureLeaderboardStorage = (gameTypeOverride) => {
    const storage = getStorage();
    const key = getGameSpecificKey('leaderboard', gameTypeOverride);
    if (!Array.isArray(storage[key])) {
      storage[key] = [];
    }
    return storage[key];
  };

  const normalizeUploadedFlag = (value) => {
    if (value === true) {
      return true;
    }

    if (value === false || value === null || typeof value === 'undefined') {
      return false;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return false;
      }
      if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === 'no') {
        return false;
      }
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return Boolean(value);
  };

  const normalizeEntry = (entry) => {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const numericSeconds = Number(entry.seconds);
    const normalizedSeconds = Number.isFinite(numericSeconds) ? numericSeconds : null;
    const uploaded = normalizeUploadedFlag(entry.uploaded);
    const gameType = resolveGameType(entry.gameType);
    const { score, parSeconds } = computeDifficultyScore({
      difficulties,
      difficulty: entry.difficulty,
      seconds: normalizedSeconds
    });

    return {
      ...entry,
      seconds: normalizedSeconds,
      score,
      parSeconds,
      uploaded,
      gameType
    };
  };

  const serializeEntryForStorage = (entry) => {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const boardId = typeof entry.boardId === 'string' ? entry.boardId.trim() : '';
    if (!boardId) {
      return null;
    }

    const secondsValue = Number(entry.seconds);
    const normalizedSeconds = Number.isFinite(secondsValue) ? secondsValue : null;
    const difficultyValue =
      typeof entry.difficulty === 'string' && entry.difficulty.trim().length > 0
        ? entry.difficulty.trim()
        : null;
    const solvedAtValue =
      typeof entry.solvedAt === 'string' && entry.solvedAt.trim().length > 0
        ? entry.solvedAt
        : null;
    const dateValue =
      typeof entry.date === 'string' && entry.date.trim().length > 0 ? entry.date : null;
    const initialsValue =
      typeof entry.initials === 'string' && entry.initials.trim().length > 0
        ? entry.initials.trim().slice(0, 3)
        : null;

    return {
      boardId,
      difficulty: difficultyValue,
      seconds: normalizedSeconds,
      solvedAt: solvedAtValue,
      date: dateValue,
      uploaded: normalizeUploadedFlag(entry.uploaded),
      initials: initialsValue,
      gameType: resolveGameType(entry.gameType)
    };
  };

  const compareEntries = (a, b) => {
    const aScore = Number.isFinite(a?.score) ? a.score : Number.NEGATIVE_INFINITY;
    const bScore = Number.isFinite(b?.score) ? b.score : Number.NEGATIVE_INFINITY;

    if (aScore !== bScore) {
      return bScore - aScore;
    }

    const aSeconds = Number.isFinite(a?.seconds) ? a.seconds : Number.MAX_SAFE_INTEGER;
    const bSeconds = Number.isFinite(b?.seconds) ? b.seconds : Number.MAX_SAFE_INTEGER;

    if (aSeconds !== bSeconds) {
      return aSeconds - bSeconds;
    }

    return (a?.solvedAt || '').localeCompare(b?.solvedAt || '');
  };

  const formatScoreDisplay = (value) => {
    if (typeof formatScoreValue === 'function') {
      return formatScoreValue(value);
    }
    const numeric = Number.isFinite(value) ? value : 0;
    return String(Math.max(0, Math.round(numeric)));
  };

  const sortLeaderboardEntries = (entries = []) =>
    entries.filter(Boolean).sort(compareEntries);

  const readStoredLeaderboardEntries = (gameTypeOverride) =>
    sortLeaderboardEntries(
      ensureLeaderboardStorage(gameTypeOverride)
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => normalizeEntry(entry))
    );

  const persistLeaderboardEntries = (entries = [], gameTypeOverride) => {
    const leaderboard = ensureLeaderboardStorage(gameTypeOverride);
    leaderboard.length = 0;
    entries
      .map((entry) => serializeEntryForStorage(entry))
      .filter((entry) => entry && entry.boardId)
      .slice(0, MAX_LEADERBOARD_ENTRIES)
      .forEach((entry) => {
        leaderboard.push(entry);
      });
    writeStorage(getStorage());
  };

  const getLeaderboardEntries = () =>
    readStoredLeaderboardEntries().filter(
      (entry) => typeof entry?.boardId === 'string' && entry.boardId.trim().length > 0
    );

  const getBestLocalEntry = () => {
    const [best] = getLeaderboardEntries();
    return best || null;
  };

  const hasAnyCompletedBoards = () => getLeaderboardEntries().length > 0;

  const getDifficultyLabel = (difficulty) => {
    const config = difficulties[difficulty];
    if (config?.labelKey) {
      return translate(config.labelKey);
    }
    if (typeof difficulty === 'string' && difficulty.length > 0) {
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
    return translate('difficultyLabel');
  };

  const createLeaderboardListItem = ({ entry, index, isGlobal }) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-list__item';

    const rank = document.createElement('span');
    rank.className = 'leaderboard-list__rank';
    rank.textContent = String(index + 1);
    item.appendChild(rank);

    const details = document.createElement('div');
    details.className = 'leaderboard-list__details';
    if (isGlobal) {
      details.classList.add('leaderboard-list__details--global');
    }

    if (isGlobal) {
      const identity = document.createElement('div');
      identity.className = 'leaderboard-list__identity';

      const name = document.createElement('span');
      name.className = 'leaderboard-list__name';
      name.textContent = (entry.initials || '---').toString().toUpperCase();

      const difficulty = document.createElement('span');
      difficulty.className = 'leaderboard-list__difficulty';
      difficulty.textContent = getDifficultyLabel(entry.difficulty);

      identity.appendChild(name);
      identity.appendChild(difficulty);
      details.appendChild(identity);
    } else {
      const difficulty = document.createElement('span');
      difficulty.className = 'leaderboard-list__difficulty';
      difficulty.textContent = getDifficultyLabel(entry.difficulty);
      details.appendChild(difficulty);
    }

    const metrics = document.createElement('div');
    metrics.className = 'leaderboard-list__metrics';

    const score = document.createElement('span');
    score.className = 'leaderboard-list__score';
    score.textContent = translate('leaderboardScoreValue', {
      score: formatScoreDisplay(entry.score)
    });

    const time = document.createElement('span');
    time.className = 'leaderboard-list__time';
    time.textContent = formatTime(entry.seconds);

    metrics.appendChild(score);
    metrics.appendChild(time);

    details.appendChild(metrics);

    item.appendChild(details);

    return item;
  };

  const renderLocalLeaderboard = () => {
    if (localView) {
      const isActive = state.leaderboardView === 'local';
      localView.hidden = !isActive;
      if (isActive) {
        localView.removeAttribute('aria-hidden');
      } else {
        localView.setAttribute('aria-hidden', 'true');
      }
    }

    if (!list || !emptyState) {
      return;
    }

    const entries = getLeaderboardEntries();
    list.innerHTML = '';

    if (!entries.length) {
      emptyState.textContent = translate('leaderboardEmpty');
      emptyState.hidden = false;
      emptyState.removeAttribute('aria-hidden');
      list.hidden = true;
      list.setAttribute('aria-hidden', 'true');
      return;
    }

    emptyState.hidden = true;
    emptyState.setAttribute('aria-hidden', 'true');
    list.hidden = false;
    list.removeAttribute('aria-hidden');

    entries.forEach((entry, index) => {
      list.appendChild(
        createLeaderboardListItem({
          entry,
          index,
          isGlobal: false
        })
      );
    });
  };

  const renderGlobalLeaderboard = () => {
    if (globalView) {
      const isActive = state.leaderboardView === 'global';
      globalView.hidden = !isActive;
      if (isActive) {
        globalView.removeAttribute('aria-hidden');
      } else {
        globalView.setAttribute('aria-hidden', 'true');
      }
    }

    if (!globalList || !globalEmptyState || !globalLoading) {
      return;
    }

    const hasConfiguration = supabaseHelpers.hasConfiguration();

    if (globalRefreshButton) {
      if (hasConfiguration) {
        globalRefreshButton.hidden = false;
        globalRefreshButton.disabled = state.globalLeaderboardLoading;
        globalRefreshButton.removeAttribute('aria-hidden');
      } else {
        globalRefreshButton.hidden = true;
        globalRefreshButton.setAttribute('aria-hidden', 'true');
      }
    }

    if (!hasConfiguration) {
      globalLoading.hidden = true;
      globalLoading.setAttribute('aria-hidden', 'true');
      globalList.hidden = true;
      globalList.setAttribute('aria-hidden', 'true');
      globalEmptyState.textContent = translate('leaderboardGlobalConfigure');
      globalEmptyState.hidden = false;
      globalEmptyState.removeAttribute('aria-hidden');
      return;
    }

    if (state.globalLeaderboardLoading) {
      globalLoading.hidden = false;
      globalLoading.removeAttribute('aria-hidden');
      globalList.hidden = true;
      globalList.setAttribute('aria-hidden', 'true');
      globalEmptyState.hidden = true;
      globalEmptyState.setAttribute('aria-hidden', 'true');
      return;
    }

    globalLoading.hidden = true;
    globalLoading.setAttribute('aria-hidden', 'true');

    if (state.globalLeaderboardError) {
      globalEmptyState.textContent = translate('leaderboardGlobalError');
      globalEmptyState.hidden = false;
      globalEmptyState.removeAttribute('aria-hidden');
      globalList.hidden = true;
      globalList.setAttribute('aria-hidden', 'true');
      return;
    }

    const entries = (Array.isArray(state.globalLeaderboard)
      ? state.globalLeaderboard
      : []
    )
      .map((entry) => normalizeEntry(entry))
      .filter((entry) => entry && entry.initials && entry.uploaded);

    entries.sort(compareEntries);
    globalList.innerHTML = '';

    if (!entries.length) {
      globalEmptyState.textContent = translate('leaderboardGlobalEmpty');
      globalEmptyState.hidden = false;
      globalEmptyState.removeAttribute('aria-hidden');
      globalList.hidden = true;
      globalList.setAttribute('aria-hidden', 'true');
      return;
    }

    globalEmptyState.hidden = true;
    globalEmptyState.setAttribute('aria-hidden', 'true');
    globalList.hidden = false;
    globalList.removeAttribute('aria-hidden');

    entries.forEach((entry, index) => {
      globalList.appendChild(
        createLeaderboardListItem({
          entry,
          index,
          isGlobal: true
        })
      );
    });
  };

  const renderLeaderboard = () => {
    updateLeaderboardTitle();
    updateViewToggle();
    renderLocalLeaderboard();
    renderGlobalLeaderboard();
  };

  const loadGlobalLeaderboard = async ({ force = false } = {}) => {
    const storage = getStorage();

    if (!supabaseHelpers.hasConfiguration()) {
      state.globalLeaderboard = [];
      state.globalLeaderboardLoaded = false;
      state.globalLeaderboardError = null;
      state.globalLeaderboardLoading = false;
      clearGlobalCacheForCurrentGame();
      delete storage[getGlobalFetchDateKey()];
      writeStorage(storage);
      renderGlobalLeaderboard();
      return;
    }

    if (state.globalLeaderboardLoading) {
      return;
    }

    const todayKey = getTodayKey();
    const fetchedToday = storage[getGlobalFetchDateKey()] === todayKey;

    if (state.globalLeaderboardLoaded && !force && fetchedToday) {
      renderGlobalLeaderboard();
      return;
    }

    const cachedEntry = readGlobalCacheEntry();
    if (!force && fetchedToday && cachedEntry) {
      hydrateGlobalLeaderboardFromCache();
      renderGlobalLeaderboard();
      return;
    }

    state.globalLeaderboardLoading = true;
    state.globalLeaderboardError = null;
    renderGlobalLeaderboard();

    try {
      const entries = await supabaseHelpers.fetchEntries();
      state.globalLeaderboard = entries
        .map((entry) => normalizeEntry({ ...entry, uploaded: true }))
        .filter((entry) => entry && entry.initials && entry.uploaded)
        .sort(compareEntries);
      state.globalLeaderboardLoaded = true;
      storage[getGlobalFetchDateKey()] = todayKey;
      writeGlobalCacheEntry({
        date: todayKey,
        entries: state.globalLeaderboard.map((entry) => ({
          initials: entry.initials,
          seconds: entry.seconds,
          difficulty: entry.difficulty,
          createdAt: entry.createdAt || null,
          uploaded: true
        }))
      });
      writeStorage(storage);
    } catch (error) {
      console.error('Failed to load global leaderboard', error);
      state.globalLeaderboardError = error;
    } finally {
      state.globalLeaderboardLoading = false;
      renderGlobalLeaderboard();
    }
  };

  const setLeaderboardView = (view) => {
    if (view !== 'local' && view !== 'global') {
      return;
    }
    const normalizedView = view === 'global' ? 'global' : 'local';
    state.leaderboardView = normalizedView;
    renderLeaderboard();
    if (normalizedView === 'global' && supabaseHelpers.hasConfiguration()) {
      loadGlobalLeaderboard();
    }
  };

  const recordLeaderboardEntry = ({
    boardId,
    difficulty,
    seconds,
    solvedAt,
    date,
    gameType
  }) => {
    if (!boardId) {
      return;
    }

    const type = resolveGameType(gameType);
    const leaderboard = ensureLeaderboardStorage(type);
    const normalizedNewEntry = normalizeEntry({
      boardId,
      difficulty,
      seconds,
      solvedAt,
      date,
      uploaded: false,
      gameType: type
    });

    if (!normalizedNewEntry) {
      return;
    }
    const existingIndex = leaderboard.findIndex((entry) => entry.boardId === boardId);

    if (existingIndex >= 0) {
      const existing = normalizeEntry(leaderboard[existingIndex]);
      if (!existing || !Number.isFinite(existing.seconds) || seconds < existing.seconds) {
        leaderboard[existingIndex] = normalizedNewEntry;
      } else {
        leaderboard[existingIndex] = { ...existing, solvedAt };
      }
    } else {
      leaderboard.push(normalizedNewEntry);
    }

    const normalizedEntries = readStoredLeaderboardEntries(type);
    persistLeaderboardEntries(normalizedEntries, type);
    renderLeaderboard();
  };

  const markLeaderboardEntryAsUploaded = ({ boardId, initials, gameType }) => {
    if (!boardId) {
      return;
    }

    const leaderboard = ensureLeaderboardStorage(gameType);
    const index = leaderboard.findIndex(
      (entry) => entry && typeof entry === 'object' && entry.boardId === boardId
    );

    if (index < 0) {
      return;
    }

    const existing = normalizeEntry(leaderboard[index]);
    if (!existing) {
      return;
    }

    let normalizedInitials = existing.initials || null;
    if (typeof initials === 'string') {
      const trimmed = initials.trim().slice(0, 3);
      if (trimmed) {
        normalizedInitials = trimmed.toUpperCase();
      }
    }

    leaderboard[index] = {
      ...existing,
      initials: normalizedInitials,
      uploaded: true
    };

    const normalizedEntries = readStoredLeaderboardEntries(gameType);
    persistLeaderboardEntries(normalizedEntries, gameType);
    renderLeaderboard();
  };

  const openLeaderboard = () => {
    if (!overlay) {
      return;
    }

    renderLeaderboard();
    if (supabaseHelpers.hasConfiguration()) {
      loadGlobalLeaderboard();
    }

    lastFocusedElement =
      document.activeElement && typeof document.activeElement.focus === 'function'
        ? document.activeElement
        : null;

    overlay.hidden = false;
    overlay.setAttribute('data-open', 'true');

    if (closeButton) {
      window.setTimeout(() => {
        closeButton.focus();
      }, 0);
    }
  };

  const closeLeaderboard = () => {
    if (!overlay) {
      return;
    }

    overlay.hidden = true;
    overlay.removeAttribute('data-open');

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  };

  const isLeaderboardOpen = () => Boolean(overlay && !overlay.hidden);

  const attachEventListeners = () => {
    if (button) {
      button.addEventListener('click', () => {
        openLeaderboard();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        closeLeaderboard();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          closeLeaderboard();
        }
      });
    }

    if (globalRefreshButton) {
      globalRefreshButton.addEventListener('click', () => {
        if (state.globalLeaderboardLoading) {
          return;
        }
        loadGlobalLeaderboard({ force: true });
      });
    }

    if (viewToggle) {
      viewToggle.addEventListener('click', () => {
        const nextView = state.leaderboardView === 'local' ? 'global' : 'local';
        setLeaderboardView(nextView);
      });
    }
  };

  const applyTranslations = () => {
    if (button) {
      const label = translate('actionLeaderboard');
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    }

    updateLeaderboardTitle();

    if (emptyState) {
      emptyState.textContent = translate('leaderboardEmpty');
    }

    if (localHeading) {
      localHeading.textContent = translate('leaderboardTabLocal');
    }

    if (globalHeading) {
      globalHeading.textContent = translate('leaderboardTabGlobal');
    }

    if (globalLoading) {
      globalLoading.textContent = translate('leaderboardLoading');
    }

    if (globalEmptyState) {
      globalEmptyState.textContent = translate('leaderboardGlobalConfigure');
    }

    if (globalRefreshButton) {
      globalRefreshButton.setAttribute(
        'aria-label',
        translate('leaderboardGlobalRefreshAriaLabel')
      );
      const label = translate('leaderboardGlobalRefresh');
      const labelElement = globalRefreshButton.querySelector(
        '.leaderboard-refresh-button__label'
      );
      if (labelElement) {
        labelElement.textContent = label;
      } else {
        globalRefreshButton.textContent = label;
      }
      globalRefreshButton.setAttribute('title', label);
    }

    if (closeButton) {
      closeButton.setAttribute('aria-label', translate('actionCloseLeaderboard'));
    }

    updateViewToggle();
  };

  hydrateGlobalLeaderboardFromCache();
  attachEventListeners();

  return {
    applyTranslations,
    render: renderLeaderboard,
    setView: setLeaderboardView,
    recordEntry: recordLeaderboardEntry,
    open: openLeaderboard,
    close: closeLeaderboard,
    isOpen: isLeaderboardOpen,
    loadGlobalLeaderboard,
    submitScoreToGlobalLeaderboard: supabaseHelpers.submitScore,
    hasSupabaseConfiguration: supabaseHelpers.hasConfiguration,
    getLocalEntries: getLeaderboardEntries,
    getBestLocalEntry,
    hasAnyCompletedBoards,
    markEntryAsUploaded: markLeaderboardEntryAsUploaded
  };
};
