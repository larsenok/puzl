const SCORE_SCALE = 1000;

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
  const normalizedSeconds = toFiniteNumber(seconds, null);

  if (!normalizedSeconds || normalizedSeconds <= 0) {
    return { score: 0, parSeconds, weight };
  }

  const baseRatio = parSeconds ? parSeconds / normalizedSeconds : 1 / normalizedSeconds;
  const rawScore = Math.max(0, baseRatio * weight * SCORE_SCALE);

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
