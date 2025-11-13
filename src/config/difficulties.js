export const DIFFICULTIES = {
  easy: {
    labelKey: 'difficultyEasy',
    allowedSizes: [4],
    requirement: { min: 1, max: 2 },
    parSeconds: 45,
    scoreWeight: 1
  },
  normal: {
    labelKey: 'difficultyNormal',
    allowedSizes: [5],
    requirement: { min: 1, max: 3 },
    parSeconds: 90,
    scoreWeight: 2
  },
  hard: {
    labelKey: 'difficultyHard',
    allowedSizes: [6],
    requirement: { min: 2, max: 5 },
    parSeconds: 180,
    scoreWeight: 3
  },
  extreme: {
    labelKey: 'difficultyExtreme',
    allowedSizes: [8],
    requirement: { min: 3, max: 6 },
    parSeconds: 240,
    scoreWeight: 4
  }
};

export const DEFAULT_DIFFICULTY = 'normal';
