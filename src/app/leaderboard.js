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
  difficulties,
  formatTime,
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
    closeButton,
    titleElement
  } = elements;

  const supabaseHelpers = createSupabaseHelpers(supabase);
  let lastFocusedElement = null;

  const ensureLeaderboardStorage = () => {
    const storage = getStorage();
    if (!Array.isArray(storage.leaderboard)) {
      storage.leaderboard = [];
    }
    return storage.leaderboard;
  };

  const getLeaderboardEntries = () =>
    ensureLeaderboardStorage()
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

      const time = document.createElement('span');
      time.className = 'leaderboard-list__time';
      time.textContent = formatTime(entry.seconds);

      details.appendChild(difficulty);
      details.appendChild(time);
      item.appendChild(details);

      list.appendChild(item);
    });

    list.hidden = !isActive;
  };

  const renderGlobalLeaderboard = (isActive) => {
    if (!globalList || !globalEmptyState || !globalLoading) {
      return;
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

    const entries = Array.isArray(state.globalLeaderboard) ? state.globalLeaderboard : [];
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

      const time = document.createElement('span');
      time.className = 'leaderboard-list__time';
      time.textContent = formatTime(entry.seconds);

      details.appendChild(identity);
      details.appendChild(time);
      item.appendChild(details);

      globalList.appendChild(item);
    });
  };

  const renderLeaderboard = () => {
    const view = state.leaderboardView === 'global' ? 'global' : 'local';

    tabs.forEach((tab) => {
      const isActive = tab.dataset.view === view;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    renderLocalLeaderboard(view === 'local');
    renderGlobalLeaderboard(view === 'global');
  };

  const loadGlobalLeaderboard = async ({ force = false } = {}) => {
    if (!supabaseHelpers.hasConfiguration()) {
      state.globalLeaderboard = [];
      state.globalLeaderboardLoaded = false;
      state.globalLeaderboardError = null;
      state.globalLeaderboardLoading = false;
      renderGlobalLeaderboard(state.leaderboardView === 'global');
      return;
    }

    if (state.globalLeaderboardLoading) {
      return;
    }

    if (state.globalLeaderboardLoaded && !force) {
      renderGlobalLeaderboard(state.leaderboardView === 'global');
      return;
    }

    state.globalLeaderboardLoading = true;
    state.globalLeaderboardError = null;
    renderGlobalLeaderboard(state.leaderboardView === 'global');

    try {
      const entries = await supabaseHelpers.fetchEntries();
      state.globalLeaderboard = entries;
      state.globalLeaderboardLoaded = true;
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
    const newEntry = { boardId, difficulty, seconds, solvedAt, date };
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

    writeStorage(getStorage());
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

    if (closeButton) {
      closeButton.setAttribute('aria-label', translate('actionCloseLeaderboard'));
    }
  };

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
    hasSupabaseConfiguration: supabaseHelpers.hasConfiguration
  };
};
