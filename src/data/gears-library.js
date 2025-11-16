const normalizeHints = (hints = []) =>
  Array.isArray(hints) ? hints.map((value) => Number(value) || 0).filter((value) => value > 0) : [];

const buildHintsFromSolution = (solution = []) => {
  const size = solution.length;
  const rowHints = solution.map((row) => {
    const groups = [];
    let count = 0;
    row.forEach((cell) => {
      if (cell) {
        count += 1;
      } else if (count > 0) {
        groups.push(count);
        count = 0;
      }
    });
    if (count > 0) {
      groups.push(count);
    }
    return groups;
  });

  const columnHints = Array.from({ length: size }, (_, column) => {
    const groups = [];
    let count = 0;
    for (let row = 0; row < size; row += 1) {
      if (solution[row][column]) {
        count += 1;
      } else if (count > 0) {
        groups.push(count);
        count = 0;
      }
    }
    if (count > 0) {
      groups.push(count);
    }
    return groups;
  });

  return { rowHints, columnHints };
};

const createPuzzle = ({ id, size, rows, rowHints, columnHints, difficulty }) => {
  const solution = rows.map((row) => row.map((value) => value === 1));
  const computed = buildHintsFromSolution(solution);
  return {
    id,
    size,
    difficulty,
    solution,
    rowHints: rowHints ? rowHints.map((hint) => normalizeHints(hint)) : computed.rowHints,
    columnHints: columnHints
      ? columnHints.map((hint) => normalizeHints(hint))
      : computed.columnHints
  };
};

export const GEAR_PUZZLES = [
  createPuzzle({
    id: 'gear-1',
    size: 5,
    difficulty: 'easy',
    rows: [
      [1, 0, 1, 1, 0],
      [1, 1, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 0, 1],
      [1, 1, 1, 0, 0]
    ],
    rowHints: [[1, 2], [2, 1], [3], [1, 1], [3]],
    columnHints: [[2, 1], [4], [1, 1, 1], [3], [1]]
  }),
  createPuzzle({
    id: 'gear-2',
    size: 6,
    difficulty: 'normal',
    rows: [
      [0, 1, 1, 0, 0, 1],
      [1, 1, 0, 0, 1, 1],
      [1, 0, 0, 1, 1, 1],
      [1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0]
    ],
    rowHints: [[2, 1], [2, 2], [1, 3], [3], [2, 1], [1, 3]],
    columnHints: [[3, 1], [2, 1], [1, 3], [1, 2], [2, 1], [3, 1]]
  }),
  createPuzzle({
    id: 'gear-3',
    size: 7,
    difficulty: 'hard',
    rows: [
      [1, 1, 0, 0, 1, 0, 1],
      [0, 1, 1, 1, 0, 1, 0],
      [1, 0, 0, 1, 1, 1, 0],
      [1, 1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 0, 1, 0, 1, 0, 1],
      [0, 1, 1, 1, 0, 1, 1]
    ],
    rowHints: [[2, 1, 1], [3, 1], [1, 3], [3, 2], [3], [1, 1, 1, 1], [3, 2]],
    columnHints: [[1, 2, 1], [2, 1, 1], [1, 4], [2, 1, 1], [1, 1, 2], [3, 1], [1, 1, 2]]
  })
];
