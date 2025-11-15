import { computeDifficultyScore } from '../utils/score.js';

const normalizeInitials = (value = '', locale) => {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    const letters = Array.from(value).filter((char) => /\p{L}/u.test(char)).slice(0, 3);
    return letters.join('').toLocaleUpperCase(locale || undefined);
  } catch (error) {
    const sanitized = value.replace(/[^A-Za-z]/g, '').slice(0, 3);
    return sanitized.toLocaleUpperCase(locale || undefined);
  }
};

export const createPostScoreController = ({
  state,
  translate,
  formatTime,
  formatScoreValue,
  difficulties = {},
  getStorage,
  writeStorage,
  submitScore,
  updateStatus,
  onGlobalLeaderboardRefresh = () => {},
  markEntryUploaded = () => {},
  locale,
  canSubmitToGlobalLeaderboard = () => true,
  getBestLocalEntry = () => null,
  hasAnyCompletedBoards = () => false,
  hasPostedEntry = () => false,
  markEntryPosted = () => {},
  elements
}) => {
  const {
    button,
    overlay,
    form,
    input,
    scoreElement,
    submitButton,
    cancelButton,
    titleElement,
    scoreLabelElement
  } = elements;

  let lastFocusedElement = null;
  let submissionEntry = null;

  const readBestEntry = () => {
    if (typeof getBestLocalEntry === 'function') {
      const entry = getBestLocalEntry();
      if (entry && typeof entry === 'object') {
        return entry;
      }
    }
    return null;
  };

  const hasCompletedBoards = () =>
    typeof hasAnyCompletedBoards === 'function'
      ? hasAnyCompletedBoards()
      : Boolean(readBestEntry());

  const resolveSubmissionEntry = () => submissionEntry || readBestEntry();

  const computeEntryScore = (entry) => {
    if (!entry) {
      return null;
    }
    if (Number.isFinite(entry.score)) {
      return entry.score;
    }
    const { score } = computeDifficultyScore({
      difficulties,
      difficulty: entry.difficulty,
      seconds: entry.seconds
    });
    return Number.isFinite(score) ? score : null;
  };

  const updateScoreDisplay = () => {
    if (!scoreElement) {
      return;
    }

    const entry = resolveSubmissionEntry();

    if (!entry) {
      const fallbackScore =
        typeof formatScoreValue === 'function'
          ? formatScoreValue(0)
          : String(0);
      scoreElement.textContent = translate('postScoreScoreValue', {
        score: fallbackScore,
        time: '--:--'
      });
      return;
    }

    const { score } = computeDifficultyScore({
      difficulties,
      difficulty: entry.difficulty,
      seconds: entry.seconds
    });

    const formattedScore =
      typeof formatScoreValue === 'function'
        ? formatScoreValue(score)
        : String(Math.max(0, Math.round(Number.isFinite(score) ? score : 0)));
    const timeDisplay = Number.isFinite(entry.seconds) ? formatTime(entry.seconds) : '--:--';

    scoreElement.textContent = translate('postScoreScoreValue', {
      score: formattedScore,
      time: timeDisplay
    });
  };

  const applyTranslations = () => {
    if (button) {
      button.textContent = translate('actionPostBest');
      button.setAttribute('aria-label', translate('postScoreButtonLabel'));
    }

    if (titleElement) {
      titleElement.textContent = translate('postScoreTitle');
    }

    if (scoreLabelElement) {
      scoreLabelElement.textContent = translate('postScoreScoreLabel');
    }

    updateScoreDisplay();

    if (submitButton) {
      submitButton.textContent = translate('postScoreSend');
    }

    if (cancelButton) {
      cancelButton.textContent = translate('postScoreAbort');
    }

    if (input) {
      const ariaLabel = translate('postScoreInputLabel');
      input.setAttribute('aria-label', ariaLabel);
      input.setAttribute('placeholder', translate('postScoreInputPlaceholder'));
    }
  };

  const updateButtonState = () => {
    if (!button) {
      return;
    }

    const canSubmit =
      typeof canSubmitToGlobalLeaderboard === 'function'
        ? canSubmitToGlobalLeaderboard()
        : Boolean(canSubmitToGlobalLeaderboard);

    const hasBoards = hasCompletedBoards();
    const shouldShow = Boolean(hasBoards && canSubmit);
    button.hidden = !shouldShow;

    const shouldDisable = !shouldShow || state.postScoreSubmitting;
    button.disabled = shouldDisable;
    button.setAttribute('aria-disabled', shouldDisable ? 'true' : 'false');

    button.removeAttribute('title');
  };

  const renderModalState = () => {
    if (submitButton) {
      submitButton.disabled = state.postScoreSubmitting;
    }

    if (cancelButton) {
      cancelButton.disabled = state.postScoreSubmitting;
    }

    if (overlay) {
      if (state.postScoreSubmitting) {
        overlay.setAttribute('data-loading', 'true');
      } else {
        overlay.removeAttribute('data-loading');
      }
    }

    updateButtonState();
  };

  const closeModal = () => {
    if (!overlay) {
      return;
    }

    overlay.hidden = true;
    overlay.removeAttribute('data-open');
    state.postScoreSubmitting = false;
    submissionEntry = null;
    renderModalState();

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  };

  const openModal = () => {
    const canSubmit =
      typeof canSubmitToGlobalLeaderboard === 'function'
        ? canSubmitToGlobalLeaderboard()
        : Boolean(canSubmitToGlobalLeaderboard);

    if (!overlay || !canSubmit) {
      return;
    }

    const bestEntry = readBestEntry();
    const hasBoards = hasCompletedBoards();

    if (!bestEntry || !hasBoards) {
      return;
    }

    submissionEntry = bestEntry;
    state.postScoreSubmitting = false;
    renderModalState();

    if (scoreElement) {
      updateScoreDisplay();
    }

    if (input) {
      const storage = getStorage();
      const storedInitials = (storage.lastInitials || '').toString().slice(0, 3);
      input.value = storedInitials;
      input.setCustomValidity('');
    }

    lastFocusedElement =
      document.activeElement && typeof document.activeElement.focus === 'function'
        ? document.activeElement
        : null;

    overlay.hidden = false;
    overlay.setAttribute('data-open', 'true');

    window.setTimeout(() => {
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const isOpen = () => Boolean(overlay && !overlay.hidden);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!input) {
      return;
    }

    const entry = resolveSubmissionEntry();

    if (!entry) {
      return;
    }

    const normalized = normalizeInitials(input.value, locale);
    input.value = normalized;

    if (normalized.length !== 3) {
      input.setCustomValidity(translate('postScoreInitialsError'));
      input.reportValidity();
      return;
    }

    input.setCustomValidity('');

    if (scoreElement) {
      updateScoreDisplay();
    }

    const postedScore = computeEntryScore(entry);
    const alreadyPosted =
      typeof hasPostedEntry === 'function'
        ? hasPostedEntry({
            boardId: entry.boardId,
            difficulty: entry.difficulty,
            seconds: entry.seconds,
            solvedAt: entry.solvedAt
          })
        : false;

    if (alreadyPosted) {
      console.info('Skipping global submission for duplicate entry.');
      return;
    }

    const storageSnapshot = typeof getStorage === 'function' ? getStorage() : null;
    const lastPostedScore = Number(storageSnapshot?.globalLeaderboardLastPostedScore);
    const hasLastPostedScore = Number.isFinite(lastPostedScore);

    if (hasLastPostedScore && Number.isFinite(postedScore) && postedScore <= lastPostedScore) {
      updateStatus('notice', translate('postScoreNeedsHigherScore'));
      window.setTimeout(() => {
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
      return;
    }

    state.postScoreSubmitting = true;
    renderModalState();

    try {
      const result = await submitScore({
        initials: normalized,
        seconds: entry.seconds,
        difficulty: entry.difficulty
      });

      const storage = getStorage();
      storage.lastInitials = normalized;
      writeStorage(storage);

      if (result?.skipped) {
        updateStatus('notice', translate('leaderboardGlobalConfigure'));
      } else {
        if (typeof markEntryUploaded === 'function') {
          try {
            markEntryUploaded({
              boardId: entry.boardId,
              initials: normalized,
              difficulty: entry.difficulty,
              seconds: entry.seconds,
              solvedAt: entry.solvedAt
            });
          } catch (markError) {
            console.error('Failed to mark leaderboard entry as uploaded', markError);
          }
        }
        if (typeof markEntryPosted === 'function') {
          try {
            markEntryPosted({
              boardId: entry.boardId,
              difficulty: entry.difficulty,
              seconds: entry.seconds,
              solvedAt: entry.solvedAt,
              score: postedScore
            });
          } catch (postError) {
            console.error('Failed to record posted leaderboard entry', postError);
          }
        }
        updateStatus('success', translate('postScoreSubmitted'));
        state.globalLeaderboardLoaded = false;
        state.globalLeaderboardError = null;
        onGlobalLeaderboardRefresh({ force: true });
      }

      closeModal();
    } catch (error) {
      console.error('Failed to submit score to global leaderboard', error);
      state.postScoreSubmitting = false;
      renderModalState();
      updateStatus('alert', translate('postScoreSubmitError'));
      window.setTimeout(() => {
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    }
  };

  const attachEventListeners = () => {
    if (button) {
      button.addEventListener('click', () => {
        if (state.postScoreSubmitting || button.disabled) {
          return;
        }
        openModal();
      });
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        if (state.postScoreSubmitting) {
          return;
        }
        closeModal();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay && !state.postScoreSubmitting) {
          closeModal();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    if (input) {
      input.addEventListener('input', () => {
        const normalized = normalizeInitials(input.value, locale);
        input.value = normalized;
        input.setCustomValidity('');
      });
    }
  };

  attachEventListeners();

  return {
    applyTranslations,
    updateButtonState,
    close: closeModal,
    isOpen,
    renderModalState
  };
};
