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
  getStorage,
  writeStorage,
  submitScore,
  updateStatus,
  onGlobalLeaderboardRefresh = () => {},
  locale,
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
    descriptionElement,
    scoreLabelElement
  } = elements;

  let lastFocusedElement = null;

  const applyTranslations = () => {
    if (button) {
      button.textContent = translate('actionPostScore');
      button.setAttribute('aria-label', translate('postScoreButtonLabel'));
    }

    if (titleElement) {
      titleElement.textContent = translate('postScoreTitle');
    }

    if (descriptionElement) {
      descriptionElement.textContent = translate('postScoreDescription');
    }

    if (scoreLabelElement) {
      scoreLabelElement.textContent = translate('postScoreScoreLabel');
    }

    if (submitButton) {
      submitButton.textContent = translate('postScoreSend');
    }

    if (cancelButton) {
      cancelButton.textContent = translate('postScoreAbort');
    }

    if (input) {
      const label = translate('postScoreInitialsLabel');
      input.setAttribute('aria-label', label);
      input.setAttribute('placeholder', label);
    }
  };

  const updateButtonState = () => {
    if (!button) {
      return;
    }

    const shouldShow = Boolean(state.isSolved);
    button.hidden = !shouldShow;

    const shouldDisable = !shouldShow || state.controlsLocked || state.postScoreSubmitting;
    button.disabled = shouldDisable;

    if (shouldDisable) {
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('aria-disabled');
    }
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
    renderModalState();

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  };

  const openModal = () => {
    if (!overlay || !state.isSolved) {
      return;
    }

    state.postScoreSubmitting = false;
    renderModalState();

    if (scoreElement) {
      scoreElement.textContent = formatTime(state.timer.secondsElapsed);
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

    if (!state.isSolved || !input) {
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
      scoreElement.textContent = formatTime(state.timer.secondsElapsed);
    }

    state.postScoreSubmitting = true;
    renderModalState();

    try {
      const result = await submitScore({
        initials: normalized,
        seconds: state.timer.secondsElapsed,
        difficulty: state.difficulty
      });

      const storage = getStorage();
      storage.lastInitials = normalized;
      writeStorage(storage);

      if (result?.skipped) {
        updateStatus('notice', translate('leaderboardGlobalConfigure'));
      } else {
        updateStatus('success', translate('postScoreSubmitted'));
        state.globalLeaderboardLoaded = false;
        state.globalLeaderboardError = null;
        if (state.leaderboardView === 'global') {
          onGlobalLeaderboardRefresh({ force: true });
        }
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
        if (state.controlsLocked || !state.isSolved || state.postScoreSubmitting) {
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
