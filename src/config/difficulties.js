export const DIFFICULTIES = {
  easy: {
    labelKey: 'difficultyEasy',
    allowedSizes: [4],
    requirement: { min: 1, max: 2 }
  },
  normal: {
    labelKey: 'difficultyNormal',
    allowedSizes: [5],
    requirement: { min: 1, max: 3 }
  },
  hard: {
    labelKey: 'difficultyHard',
    allowedSizes: [6],
    requirement: { min: 2, max: 5 }
  },
  extreme: {
    labelKey: 'difficultyExtreme',
    allowedSizes: [8],
    requirement: { min: 3, max: 6 }
  }
};

export const DEFAULT_DIFFICULTY = 'normal';
