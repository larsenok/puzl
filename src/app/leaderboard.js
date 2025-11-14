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
  elements
}) => {
  const {
    button,
    overlay,
    list,
    emptyState,
    tabs,
    globalList,
    globalEmptyState,
    globalLoading,
    globalRefreshButton,
    closeButton,
    titleElement
  } = elements;

  const supabaseHelpers = createSupabaseHelpers(supabase);
  let lastFocusedElement = null;

  const hydrateGlobalLeaderboardFromCache = () => {
    if (!supabaseHelpers.hasConfiguration()) {
      return;
    }

    const storage = getStorage();
    const cache = storage.globalLeaderboardCache;

    if (!cache || !Array.isArray(cache.entries)) {
      return;
    }

    const hydratedEntries = cache.entries
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
    state.globalLeaderboardLoaded = storage.globalLeaderboardLastFetchDate === todayKey;
  };

  const ensureLeaderboardStorage = () => {
    const storage = getStorage();
    if (!Array.isArray(storage.leaderboard)) {
      storage.leaderboard = [];
    }
    return storage.leaderboard;
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
      uploaded
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

  const readStoredLeaderboardEntries = () =>
    sortLeaderboardEntries(
      ensureLeaderboardStorage()
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => normalizeEntry(entry))
    );

  const persistLeaderboardEntries = (entries) => {
    const leaderboard = ensureLeaderboardStorage();
    leaderboard.length = 0;
    entries.slice(0, MAX_LEADERBOARD_ENTRIES).forEach((entry) => {
      leaderboard.push(entry);
    });
    writeStorage(getStorage());
  };

  const getLeaderboardEntries = () =>
    readStoredLeaderboardEntries().filter((entry) => entry.uploaded !== true);

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

  const renderLocalLeaderboard = (isActive) => {
    if (!list || !emptyState) {
      return;
    }

    const entries = getLeaderboardEntries();
    list.innerHTML = '';

    if (!entries.length) {
      emptyState.textContent = translate('leaderboardEmpty');
      emptyState.hidden = !isActive;
      list.hidden = true;
      return;
    }

    emptyState.hidden = true;

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

      details.appendChild(difficulty);
      details.appendChild(metrics);
      item.appendChild(details);

      list.appendChild(item);
    });

    list.hidden = !isActive;
  };

  const renderGlobalLeaderboard = (isActive) => {
    if (!globalList || !globalEmptyState || !globalLoading) {
      return;
    }

    const canShowRefresh = Boolean(isActive && supabaseHelpers.hasConfiguration());

    if (globalRefreshButton) {
      if (canShowRefresh) {
        globalRefreshButton.hidden = false;
        globalRefreshButton.disabled = state.globalLeaderboardLoading;
        globalRefreshButton.removeAttribute('aria-hidden');
      } else {
        globalRefreshButton.hidden = true;
        globalRefreshButton.setAttribute('aria-hidden', 'true');
      }
    }

    if (!isActive) {
      globalList.hidden = true;
      globalEmptyState.hidden = true;
      globalLoading.hidden = true;
      return;
    }

    if (!supabaseHelpers.hasConfiguration()) {
      globalLoading.hidden = true;
      globalList.hidden = true;
      globalEmptyState.textContent = translate('leaderboardGlobalConfigure');
      globalEmptyState.hidden = false;
      return;
    }

    if (state.globalLeaderboardLoading) {
      globalLoading.hidden = false;
      globalList.hidden = true;
      globalEmptyState.hidden = true;
      return;
    }

    globalLoading.hidden = true;

    if (state.globalLeaderboardError) {
      globalEmptyState.textContent = translate('leaderboardGlobalError');
      globalEmptyState.hidden = false;
      globalList.hidden = true;
      return;
    }

    const entries = Array.isArray(state.globalLeaderboard)
      ? state.globalLeaderboard
          .map((entry) => normalizeEntry(entry))
          .filter((entry) => entry && entry.initials && entry.uploaded)
      : [];
    entries.sort(compareEntries);
    globalList.innerHTML = '';

    if (!entries.length) {
      globalEmptyState.textContent = translate('leaderboardGlobalEmpty');
      globalEmptyState.hidden = false;
      globalList.hidden = true;
      return;
    }

    globalEmptyState.hidden = true;
    globalList.hidden = false;

    entries.forEach((entry, index) => {
      const item = document.createElement('li');
      item.className = 'leaderboard-list__item';

      const rank = document.createElement('span');
      rank.className = 'leaderboard-list__rank';
      rank.textContent = String(index + 1);
      item.appendChild(rank);

      const details = document.createElement('div');
      details.className = 'leaderboard-list__details leaderboard-list__details--global';

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

      details.appendChild(identity);
      details.appendChild(metrics);
      item.appendChild(details);

      globalList.appendChild(item);
    });
  };

  const canUseGlobalLeaderboard = () => supabaseHelpers.hasConfiguration();

  const renderLeaderboard = () => {
    const globalAvailable = canUseGlobalLeaderboard();

    if (!globalAvailable && state.leaderboardView === 'global') {
      state.leaderboardView = 'local';
    }

    const view = state.leaderboardView === 'global' && globalAvailable ? 'global' : 'local';

    tabs.forEach((tab) => {
      const tabView = tab.dataset.view === 'global' ? 'global' : 'local';
      const isActive = tabView === view;
      const shouldHide = tabView === 'global' && !globalAvailable;

      tab.classList.toggle('is-active', isActive && !shouldHide);
      tab.setAttribute('aria-selected', String(isActive && !shouldHide));
      tab.setAttribute('tabindex', shouldHide ? '-1' : isActive ? '0' : '-1');

      if (shouldHide) {
        tab.hidden = true;
        tab.setAttribute('aria-hidden', 'true');
      } else {
        tab.hidden = false;
        tab.removeAttribute('aria-hidden');
      }
    });

    renderLocalLeaderboard(view === 'local');
    renderGlobalLeaderboard(view === 'global' && globalAvailable);
  };

  const loadGlobalLeaderboard = async ({ force = false } = {}) => {
    const storage = getStorage();

    if (!supabaseHelpers.hasConfiguration()) {
      state.globalLeaderboard = [];
      state.globalLeaderboardLoaded = false;
      state.globalLeaderboardError = null;
      state.globalLeaderboardLoading = false;
      delete storage.globalLeaderboardCache;
      writeStorage(storage);
      renderGlobalLeaderboard(state.leaderboardView === 'global');
      return;
    }

    if (state.globalLeaderboardLoading) {
      return;
    }

    const todayKey = getTodayKey();
    const fetchedToday = storage.globalLeaderboardLastFetchDate === todayKey;

    if (state.globalLeaderboardLoaded && !force && fetchedToday) {
      renderGlobalLeaderboard(state.leaderboardView === 'global');
      return;
    }

    if (!force && fetchedToday && Array.isArray(storage.globalLeaderboardCache?.entries)) {
      hydrateGlobalLeaderboardFromCache();
      renderGlobalLeaderboard(state.leaderboardView === 'global');
      return;
    }

    state.globalLeaderboardLoading = true;
    state.globalLeaderboardError = null;
    renderGlobalLeaderboard(state.leaderboardView === 'global');

    try {
      const entries = await supabaseHelpers.fetchEntries();
      state.globalLeaderboard = entries
        .map((entry) => normalizeEntry({ ...entry, uploaded: true }))
        .filter((entry) => entry && entry.initials && entry.uploaded)
        .sort(compareEntries);
      state.globalLeaderboardLoaded = true;
      storage.globalLeaderboardLastFetchDate = todayKey;
      storage.globalLeaderboardCache = {
        date: todayKey,
        entries: state.globalLeaderboard.map((entry) => ({
          initials: entry.initials,
          seconds: entry.seconds,
          difficulty: entry.difficulty,
          createdAt: entry.createdAt || null,
          uploaded: true
        }))
      };
      writeStorage(storage);
    } catch (error) {
      console.error('Failed to load global leaderboard', error);
      state.globalLeaderboardError = error;
    } finally {
      state.globalLeaderboardLoading = false;
      renderGlobalLeaderboard(state.leaderboardView === 'global');
    }
  };

  const setLeaderboardView = (view) => {
    if (view !== 'local' && view !== 'global') {
      return;
    }
    if (view === 'global' && !canUseGlobalLeaderboard()) {
      return;
    }
    state.leaderboardView = view;
    renderLeaderboard();
    if (view === 'global') {
      loadGlobalLeaderboard();
    }
  };

  const recordLeaderboardEntry = ({ boardId, difficulty, seconds, solvedAt, date }) => {
    if (!boardId) {
      return;
    }

    const leaderboard = ensureLeaderboardStorage();
    const normalizedNewEntry = normalizeEntry({
      boardId,
      difficulty,
      seconds,
      solvedAt,
      date,
      uploaded: false
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

    const normalizedEntries = readStoredLeaderboardEntries();
    persistLeaderboardEntries(normalizedEntries);
    renderLeaderboard();
  };

  const markLeaderboardEntryAsUploaded = ({ boardId, initials }) => {
    if (!boardId) {
      return;
    }

    const leaderboard = ensureLeaderboardStorage();
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

    const normalizedEntries = readStoredLeaderboardEntries();
    persistLeaderboardEntries(normalizedEntries);
    renderLeaderboard();
  };

  const openLeaderboard = () => {
    if (!overlay) {
      return;
    }

    renderLeaderboard();
    if (state.leaderboardView === 'global') {
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
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const { view } = tab.dataset;
        setLeaderboardView(view === 'global' ? 'global' : 'local');
      });
    });

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
  };

  const applyTranslations = () => {
    if (button) {
      const label = translate('actionLeaderboard');
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    }

    if (titleElement) {
      titleElement.textContent = translate('leaderboardTitle');
    }

    if (emptyState) {
      emptyState.textContent = translate('leaderboardEmpty');
    }

    tabs.forEach((tab) => {
      const { view } = tab.dataset;
      if (view === 'local') {
        tab.textContent = translate('leaderboardTabLocal');
      } else if (view === 'global') {
        tab.textContent = translate('leaderboardTabGlobal');
      }
    });

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
