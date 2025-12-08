const SCORE_SCALE = 1000;
const EXTREME_DIFFICULTY_BONUS = 1.1;
const DIFFICULTY_SCORE_MULTIPLIERS = {
  easy: 2,
  normal: 1.5,
  hard: 1.25,
  extreme: EXTREME_DIFFICULTY_BONUS
};
const SAFE_MIN_SECONDS = 0.1;

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

export const computeDifficultyScore = ({ difficulties = {}, difficulty, seconds }) => {
  const parSeconds = getParSeconds(difficulties, difficulty);
  const weight = getDifficultyWeight(difficulties, difficulty);
  const weightMultiplier = weight * weight;
  const normalizedSeconds = toFiniteNumber(seconds, null);

  if (!normalizedSeconds || normalizedSeconds <= 0) {
    return { score: 0, parSeconds, weight };
  }

  const clampedSeconds = Math.max(SAFE_MIN_SECONDS, normalizedSeconds);
  const hasPar = Number.isFinite(parSeconds) && parSeconds > 0;
  const baselinePar = hasPar ? Math.max(parSeconds, SAFE_MIN_SECONDS) : null;

  let performanceMultiplier;
  if (baselinePar) {
    if (clampedSeconds <= baselinePar) {
      const progress = (baselinePar - clampedSeconds) / baselinePar;
      performanceMultiplier = 1 + progress;
    } else {
      performanceMultiplier = baselinePar / clampedSeconds;
    }
  } else {
    performanceMultiplier = 1 / clampedSeconds;
  }

  const difficultyMultiplier = DIFFICULTY_SCORE_MULTIPLIERS[difficulty] || 1;
  const rawScore = Math.max(
    0,
    performanceMultiplier * weightMultiplier * difficultyMultiplier * SCORE_SCALE
  );

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
