const SCORE_SCALE = 1000;
const EXTREME_TIME_BONUS_MAX_MULTIPLIER = 1.25;
const EXTREME_TIME_BONUS_MIN_SECONDS = 60;
const EXTREME_TIME_BONUS_MAX_SECONDS = 90;

const toFiniteNumber = (value, fallback = null) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const getParSeconds = (difficulties = {}, difficulty) => {
  const par = difficulties?.[difficulty]?.parSeconds;
  return toFiniteNumber(par, null);
};

export const getDifficultyWeight = (difficulties = {}, difficulty) => {
  const weight = difficulties?.[difficulty]?.scoreWeight;
  if (!Number.isFinite(weight) || weight <= 0) {
    return 1;
  }
  return Number(weight);
};

const getExtremeTimeBonusMultiplier = (seconds) => {
  if (!Number.isFinite(seconds)) {
    return 1;
  }

  if (seconds <= EXTREME_TIME_BONUS_MIN_SECONDS) {
    return EXTREME_TIME_BONUS_MAX_MULTIPLIER;
  }

  if (seconds >= EXTREME_TIME_BONUS_MAX_SECONDS) {
    return 1;
  }

  const rangeSeconds = EXTREME_TIME_BONUS_MAX_SECONDS - EXTREME_TIME_BONUS_MIN_SECONDS;
  const bonusSpan = EXTREME_TIME_BONUS_MAX_MULTIPLIER - 1;
  const progress = (seconds - EXTREME_TIME_BONUS_MIN_SECONDS) / rangeSeconds;
  return EXTREME_TIME_BONUS_MAX_MULTIPLIER - bonusSpan * progress;
};

export const computeDifficultyScore = ({ difficulties = {}, difficulty, seconds }) => {
  const parSeconds = getParSeconds(difficulties, difficulty);
  const weight = getDifficultyWeight(difficulties, difficulty);
  // Square the difficulty weight so higher difficulties get a significantly
  // larger bonus when comparing runs across categories.
  const weightMultiplier = weight * weight;
  const normalizedSeconds = toFiniteNumber(seconds, null);

  if (!normalizedSeconds || normalizedSeconds <= 0) {
    return { score: 0, parSeconds, weight };
  }

  const baseRatio = parSeconds ? parSeconds / normalizedSeconds : 1 / normalizedSeconds;
  const timeBonusMultiplier =
    difficulty === 'extreme'
      ? getExtremeTimeBonusMultiplier(normalizedSeconds)
      : 1;
  const rawScore = Math.max(0, baseRatio * weightMultiplier * timeBonusMultiplier * SCORE_SCALE);

  return {
    score: Math.round(rawScore),
    parSeconds,
    weight
  };
};

export const formatScore = (score, locale) => {
  const normalizedScore = Math.max(0, toFiniteNumber(score, 0));
  try {
    return new Intl.NumberFormat(locale || undefined, {
      maximumFractionDigits: 0,
      useGrouping: true
    }).format(Math.round(normalizedScore));
  } catch (error) {
    return String(Math.round(normalizedScore));
  }
};
