export const GAME_TYPES = {
  stars: {
    id: 'stars',
    labelKey: 'gameTypeStars',
    descriptionKey: 'footerStars'
  },
  gears: {
    id: 'gears',
    labelKey: 'gameTypeGears',
    descriptionKey: 'footerGears'
  }
};

export const DEFAULT_GAME_TYPE = 'stars';

export const isValidGameType = (candidate) =>
  typeof candidate === 'string' && Object.prototype.hasOwnProperty.call(GAME_TYPES, candidate);

export const getGameDefinition = (type) => GAME_TYPES[type] || GAME_TYPES[DEFAULT_GAME_TYPE];
