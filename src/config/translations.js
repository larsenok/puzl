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
    actionPostBest: 'Post best',
    gameTypeLabel: 'Game',
    gameTypeStars: 'Stars',
    gameTypeGears: 'Gears',
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
    statusNewBoardFailed: 'Could not create a new board. Please try again.',
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
    leaderboardGlobalRefresh: 'Update',
    leaderboardGlobalRefreshAriaLabel: 'Refresh global leaderboard',
    leaderboardViewShowLocal: 'Show local list',
    leaderboardViewShowGlobal: 'Show global list',
    leaderboardViewSwitchLabel: 'Toggle between local and global leaderboard',
    leaderboardScoreValue: 'Score {score}',
    leaderboardParValue: 'Par {par}',
    actionCloseLeaderboard: 'Close leaderboard',
    difficultySet: 'Difficulty set to {difficulty}',
    footer: 'Balance each shape badge while matching every row and column total.',
    footerStars: 'Balance each shape badge while matching every row and column total.',
    footerGears:
      'Use a square matrix of gears, then follow the listed run-length rules for every row and column.',
    colorPaletteMenuLabel: 'Region color options',
    cellAria:
      'Row {row}, column {column}. Part of a shape needing {requirement} apples.',
    cellAriaGears:
      'Row {row}, column {column}. Toggle gears to match the listed runs.',
    postScoreTitle: 'Post best score',
    postScoreInputLabel: 'Player name',
    postScoreInputPlaceholder: 'write name',
    postScoreScoreLabel: 'Score',
    postScoreScoreValue: '{score} pts · {time}',
    postScoreSend: 'Post',
    postScoreAbort: 'Abort',
    postScoreInitialsError: 'Enter exactly three letters.',
    postScoreSubmitted: 'Score posted to the global leaderboard.',
    postScoreSubmitError: 'Could not send the score. Please try again.',
    postScoreButtonLabel: 'Post best score',
    postScoreNeedsHigherScore: 'Beat your best score to post again.',
    postScoreAlreadyPosted: 'Best score already posted.',
    postScoreBestSubmitted: 'Best was posted.',
    statusGameTypeChanged: '{game} board ready.'
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
    actionPostBest: 'Del beste',
    gameTypeLabel: 'Spill',
    gameTypeStars: 'Stjerner',
    gameTypeGears: 'Gears',
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
    statusNewBoardFailed: 'Kunne ikke lage et nytt brett. Prøv igjen.',
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
    leaderboardGlobalRefresh: 'Oppdater',
    leaderboardGlobalRefreshAriaLabel: 'Oppdater global toppliste',
    leaderboardViewShowLocal: 'Vis lokal liste',
    leaderboardViewShowGlobal: 'Vis global liste',
    leaderboardViewSwitchLabel: 'Bytt mellom lokal og global toppliste',
    leaderboardScoreValue: 'Poeng {score}',
    leaderboardParValue: 'Par {par}',
    actionCloseLeaderboard: 'Lukk topplisten',
    difficultySet: 'Vanskelighetsgrad satt til {difficulty}',
    statusProgressCleared: 'Fremdrift slettet. Klar for nye brett.',
    footer:
      'Match hver rad- og kolonneverdi mens hvert område får riktig antall merker.',
    footerStars:
      'Match hver rad- og kolonneverdi mens hvert område får riktig antall merker.',
    footerGears:
      'Bruk et kvadratisk rutenett med gir, og følg reglene som står ved hver rad og kolonne.',
    colorPaletteMenuLabel: 'Fargevalg for regioner',
    cellAria:
      'Rad {row}, kolonne {column}. Del av en form som trenger {requirement} epler.',
    cellAriaGears:
      'Rad {row}, kolonne {column}. Slå av og på gir slik at mønsteret matcher hintene.',
    postScoreTitle: 'Del beste poengsum',
    postScoreInputLabel: 'Spillernavn',
    postScoreInputPlaceholder: 'skriv navn',
    postScoreScoreLabel: 'Poengsum',
    postScoreScoreValue: '{score} poeng · {time}',
    postScoreSend: 'Del',
    postScoreAbort: 'Avbryt',
    postScoreInitialsError: 'Skriv inn nøyaktig tre bokstaver.',
    postScoreSubmitted: 'Poengsummen ble sendt til den globale topplisten.',
    postScoreSubmitError: 'Kunne ikke sende poengsummen. Prøv igjen.',
    postScoreButtonLabel: 'Del beste poengsum',
    postScoreNeedsHigherScore: 'Slå din beste poengsum for å sende på nytt.',
    postScoreAlreadyPosted: 'Beste poengsum er allerede delt.',
    postScoreBestSubmitted: 'Beste ble delt.',
    statusGameTypeChanged: '{game}-brett klart.'
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
