import { DIFFICULTIES, DEFAULT_DIFFICULTY } from './config/difficulties.js';
import { PUZZLE_LIBRARY } from './data/puzzle-library.js';

export const CELL_STATES = ['empty', 'fruit', 'mark'];

const MAX_GENERATION_ATTEMPTS = 80;

export const createEmptyBoard = (size) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty'));

const shuffleArray = (input) => {
  const array = [...input];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
};

const getDifficultySettings = (difficulty) =>
  DIFFICULTIES[difficulty] || DIFFICULTIES[DEFAULT_DIFFICULTY];

const chooseRegionRequirement = (difficulty, minRequirement, maxRequirement) => {
  if (maxRequirement <= minRequirement) {
    return maxRequirement;
  }

  if (difficulty === 'hard' || difficulty === 'extreme') {
    const weighted = [];
    const span = maxRequirement - minRequirement;
    for (let value = minRequirement; value <= maxRequirement; value += 1) {
      if (span <= 0) {
        weighted.push(value);
        continue;
      }

      const distanceFromMax = maxRequirement - value;
      const distanceFromMin = value - minRequirement;
      const baseWeight = distanceFromMax + 1;
      const lowerBias = distanceFromMin === 0 && span > 1 ? 1 : 0;
      const weight = Math.max(1, baseWeight + lowerBias);
      for (let index = 0; index < weight; index += 1) {
        weighted.push(value);
      }
    }
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  return Math.floor(Math.random() * (maxRequirement - minRequirement + 1)) + minRequirement;
};

const chooseConfig = (difficulty) => {
  const settings = getDifficultySettings(difficulty);
  const pool = PUZZLE_LIBRARY.filter((config) =>
    !settings.allowedSizes || settings.allowedSizes.includes(config.size)
  );

  const library = pool.length > 0 ? pool : PUZZLE_LIBRARY;

  const weighted = library.flatMap((config) =>
    Array.from({ length: config.weight }, () => config)
  );
  const choice = weighted[Math.floor(Math.random() * weighted.length)];
  return choice;
};

const buildPuzzle = (difficulty, paletteColors, attempt = 0) => {
  const settings = getDifficultySettings(difficulty);
  const config = chooseConfig(difficulty);
  const { size } = config;
  const overlay = config.overlays[Math.floor(Math.random() * config.overlays.length)];
  const regionCells = new Map();

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const regionId = overlay[row][column];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
      }
      regionCells.get(regionId).push([row, column]);
    }
  }

  const solution = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  const regions = [];
  let colorIndex = 0;
  const palette = Array.isArray(paletteColors) && paletteColors.length ? paletteColors : ['#f59e0b'];
  const paletteLength = palette.length;
  const regionSizes = Array.from(regionCells.values(), (cells) => cells.length);
  const largestRegionSize = regionSizes.reduce((max, current) => Math.max(max, current), 0);
  const largeRegionCount = regionSizes.filter((regionSize) => regionSize >= 5).length;

  for (const [regionId, cells] of regionCells.entries()) {
    const maxRequirement = Math.min(cells.length, settings.requirement.max);
    let minRequirement = Math.min(maxRequirement, settings.requirement.min);
    if (difficulty === 'extreme') {
      const adjustableMin = Math.max(1, maxRequirement - 1);
      minRequirement = Math.min(minRequirement, adjustableMin);
    }
    const requirement = chooseRegionRequirement(difficulty, minRequirement, maxRequirement);
    const chosenCells = shuffleArray(cells).slice(0, requirement);
    chosenCells.forEach(([row, column]) => {
      solution[row][column] = true;
    });

    const anchor = cells.reduce((best, cell) => {
      if (!best) {
        return cell;
      }
      if (cell[0] < best[0]) {
        return cell;
      }
      if (cell[0] === best[0] && cell[1] < best[1]) {
        return cell;
      }
      return best;
    }, null);

    const color = palette[colorIndex % paletteLength];
    colorIndex += 1;

    regions.push({ id: regionId, requirement, anchor, color });
  }

  const rowTotals = solution.map((row) => row.filter(Boolean).length);
  const columnTotals = Array.from({ length: size }, (_, column) =>
    solution.reduce((sum, row) => sum + (row[column] ? 1 : 0), 0)
  );

  const hardMaxRowColumnTotal = Math.min(size, 6);
  const rowLimitExceeded =
    difficulty === 'hard'
      ? rowTotals.some((total) => total > hardMaxRowColumnTotal)
      : rowTotals.some((total) => total > size);
  const columnLimitExceeded =
    difficulty === 'hard'
      ? columnTotals.some((total) => total > hardMaxRowColumnTotal)
      : columnTotals.some((total) => total > size);

  const softRowColumnLimit = Math.max(6, size);
  const exceedsRowOrColumnLimit =
    rowTotals.some((total) => total > softRowColumnLimit) ||
    columnTotals.some((total) => total > softRowColumnLimit) ||
    rowLimitExceeded ||
    columnLimitExceeded;

  const enforceMaxCounts = difficulty === 'hard' || difficulty === 'extreme';
  const maxRowColumnTotal = difficulty === 'hard' ? hardMaxRowColumnTotal : size;
  const rowMaxCount = enforceMaxCounts
    ? rowTotals.filter((total) => total === maxRowColumnTotal).length
    : 0;
  const columnMaxCount = enforceMaxCounts
    ? columnTotals.filter((total) => total === maxRowColumnTotal).length
    : 0;

  const highRequirementCount = regions.filter((region) => region.requirement >= 4).length;
  const requirementFiveCount = regions.filter((region) => region.requirement >= 5).length;
  const smallRequirementCount = regions.filter((region) => region.requirement <= 2).length;

  const minHighRequirement = 1;
  const maxSmallRequirementFraction = difficulty === 'extreme' ? 0.95 : 0.8;
  const maxRowMaxCount = 2;
  const maxColumnMaxCount = 2;

  const requiresHardRegeneration =
    (difficulty === 'hard' || difficulty === 'extreme') &&
    (highRequirementCount < minHighRequirement ||
      largeRegionCount < 1 ||
      (largestRegionSize >= 6 && requirementFiveCount < 1) ||
      smallRequirementCount > Math.ceil(regions.length * maxSmallRequirementFraction) ||
      rowMaxCount > maxRowMaxCount ||
      columnMaxCount > maxColumnMaxCount);

  if (exceedsRowOrColumnLimit || requiresHardRegeneration) {
    if (attempt >= MAX_GENERATION_ATTEMPTS) {
      throw new Error(
        `Failed to generate a ${difficulty} puzzle within ${MAX_GENERATION_ATTEMPTS} attempts`
      );
    }
    return buildPuzzle(difficulty, palette, attempt + 1);
  }

  const regionsById = regions.reduce((accumulator, region) => {
    accumulator[String(region.id)] = region;
    return accumulator;
  }, {});

  return {
    size,
    solution,
    rowTotals,
    columnTotals,
    regionGrid: overlay,
    regions,
    regionsById
  };
};

export const createPuzzle = (difficulty, paletteColors) => buildPuzzle(difficulty, paletteColors);
