export const TRANSLATIONS = {
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
    actionLeaderboard: 'Leaderboard',
    actionPostScore: 'Post score',
    actionLockControls: 'Lock controls',
    actionUnlockControls: 'Unlock controls',
    actionShowRegionColors: 'Show region colors',
    actionHideRegionColors: 'Hide region colors',
    actionResetProgress: 'Reset local progress',
    actionColorPalette: 'Change region colors',
    timeSpent: 'Time spent',
    timeSpentLocked: 'Time spent (locked)',
    statusNewBoardReady: 'New board ready',
    statusBoardReady: 'Board ready',
    statusNewBoardCreated: 'New board created',
    statusBoardCleared: 'Board cleared',
    statusSolved: 'Solved!',
    statusKeepGoing: 'Keep going',
    statusProgressCleared: 'Progress cleared. Fresh boards await.',
    leaderboardTitle: 'Leaderboard',
    leaderboardEmpty: 'Solve a board to see it here.',
    leaderboardTabLocal: 'Local',
    leaderboardTabGlobal: 'Global',
    leaderboardLoading: 'Loading…',
    leaderboardGlobalEmpty: 'No global scores yet.',
    leaderboardGlobalConfigure: 'Connect Supabase to load the global leaderboard.',
    leaderboardGlobalError: 'Could not load the global leaderboard. Try again later.',
    actionCloseLeaderboard: 'Close leaderboard',
    difficultySet: 'Difficulty set to {difficulty}',
    footer: 'Balance each shape badge while matching every row and column total.',
    colorPaletteMenuLabel: 'Region color options',
    cellAria:
      'Row {row}, column {column}. Part of a shape needing {requirement} apples.',
    postScoreTitle: 'Post score',
    postScoreDescription: 'Enter your initials to send your time to the global leaderboard.',
    postScoreInitialsLabel: 'Initials',
    postScoreScoreLabel: 'Time',
    postScoreSend: 'Send',
    postScoreAbort: 'Abort',
    postScoreInitialsError: 'Enter exactly three letters.',
    postScoreSubmitted: 'Score posted to the global leaderboard.',
    postScoreSubmitError: 'Could not send the score. Please try again.',
    postScoreButtonLabel: 'Post score'
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
    actionLeaderboard: 'Toppliste',
    actionPostScore: 'Del poengsum',
    actionLockControls: 'Lås handlinger',
    actionUnlockControls: 'Lås opp handlinger',
    actionShowRegionColors: 'Vis regionfarger',
    actionHideRegionColors: 'Skjul regionfarger',
    actionResetProgress: 'Tilbakestill lokal fremdrift',
    actionColorPalette: 'Endre regionfarger',
    timeSpent: 'Brukt tid',
    timeSpentLocked: 'Brukt tid (låst)',
    statusNewBoardReady: 'Nytt brett klart',
    statusBoardReady: 'Brett klart',
    statusNewBoardCreated: 'Nytt brett opprettet',
    statusBoardCleared: 'Brett tømt',
    statusSolved: 'Løst!',
    statusKeepGoing: 'Fortsett',
    leaderboardTitle: 'Toppliste',
    leaderboardEmpty: 'Løs et brett for å se det her.',
    leaderboardTabLocal: 'Lokal',
    leaderboardTabGlobal: 'Global',
    leaderboardLoading: 'Laster…',
    leaderboardGlobalEmpty: 'Ingen globale poengsummer ennå.',
    leaderboardGlobalConfigure: 'Koble til Supabase for å laste den globale topplisten.',
    leaderboardGlobalError: 'Kunne ikke laste den globale topplisten. Prøv igjen senere.',
    actionCloseLeaderboard: 'Lukk topplisten',
    difficultySet: 'Vanskelighetsgrad satt til {difficulty}',
    statusProgressCleared: 'Fremdrift slettet. Klar for nye brett.',
    footer:
      'Match hver rad- og kolonneverdi mens hvert område får riktig antall merker.',
    colorPaletteMenuLabel: 'Fargevalg for regioner',
    cellAria:
      'Rad {row}, kolonne {column}. Del av en form som trenger {requirement} epler.',
    postScoreTitle: 'Del poengsum',
    postScoreDescription: 'Skriv inn initialene dine for å sende tiden til den globale topplisten.',
    postScoreInitialsLabel: 'Initialer',
    postScoreScoreLabel: 'Tid',
    postScoreSend: 'Send',
    postScoreAbort: 'Avbryt',
    postScoreInitialsError: 'Skriv inn nøyaktig tre bokstaver.',
    postScoreSubmitted: 'Poengsummen ble sendt til den globale topplisten.',
    postScoreSubmitError: 'Kunne ikke sende poengsummen. Prøv igjen.',
    postScoreButtonLabel: 'Del poengsum'
  }
};

const LOCALE_ALIASES = {
  no: 'nb',
  nn: 'nb'
};

const DEFAULT_LOCALE = 'en';

export const detectLocale = () => {
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

export const ACTIVE_LOCALE = detectLocale();

export const translate = (key, variables = {}) => {
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
