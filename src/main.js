const BOARD_SIZE = 5;
const CELL_STATES = ['empty', 'fruit', 'mark'];

const SHAPE_OVERLAYS = [
  [
    [0, 0, 0, 1, 1],
    [2, 3, 0, 1, 4],
    [2, 3, 3, 4, 4],
    [5, 5, 6, 6, 7],
    [8, 5, 9, 7, 7]
  ],
  [
    [0, 0, 1, 1, 1],
    [2, 0, 3, 4, 4],
    [2, 3, 3, 5, 4],
    [6, 6, 5, 5, 7],
    [8, 6, 9, 7, 7]
  ],
  [
    [0, 0, 1, 1, 2],
    [3, 0, 1, 4, 2],
    [3, 5, 4, 4, 2],
    [6, 5, 5, 7, 7],
    [6, 8, 8, 8, 9]
  ]
];

const REGION_COLORS = [
  '#d4a373',
  '#8ecae6',
  '#b5e48c',
  '#f6bd60',
  '#e5989b',
  '#b9fbc0',
  '#a0c4ff',
  '#f4978e',
  '#ffcb77',
  '#cdb4db'
];

const createEmptyBoard = (size) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty'));

const shuffleArray = (input) => {
  const array = [...input];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
};

const createPuzzle = (size = BOARD_SIZE) => {
  const overlay = SHAPE_OVERLAYS[Math.floor(Math.random() * SHAPE_OVERLAYS.length)];
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

  for (const [regionId, cells] of regionCells.entries()) {
    const requirement = Math.floor(Math.random() * Math.min(3, cells.length)) + 1;
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

    const color = REGION_COLORS[colorIndex % REGION_COLORS.length];
    colorIndex += 1;

    regions.push({ id: regionId, requirement, anchor, color });
  }

  const rowTotals = solution.map((row) => row.filter(Boolean).length);
  const columnTotals = Array.from({ length: size }, (_, column) =>
    solution.reduce((sum, row) => sum + (row[column] ? 1 : 0), 0)
  );

  const regionsById = regions.reduce((accumulator, region) => {
    accumulator[String(region.id)] = region;
    return accumulator;
  }, {});

  return {
    solution,
    rowTotals,
    columnTotals,
    regionGrid: overlay,
    regions,
    regionsById
  };
};

const state = {
  puzzle: createPuzzle(),
  boardState: createEmptyBoard(BOARD_SIZE)
};

const columnHintsContainer = document.getElementById('column-hints');
const boardContainer = document.getElementById('board');
const messageElement = document.getElementById('message');
const checkButton = document.getElementById('check-button');
const clearButton = document.getElementById('clear-button');
const newButton = document.getElementById('new-button');

const columnHintElements = [];
const rowHintElements = [];
const cellElements = [];

const getCurrentRowTotals = () =>
  state.boardState.map((row) => row.filter((cell) => cell === 'fruit').length);

const getCurrentColumnTotals = () =>
  Array.from({ length: BOARD_SIZE }, (_, column) =>
    state.boardState.reduce((sum, row) => sum + (row[column] === 'fruit' ? 1 : 0), 0)
  );

const applyHintClasses = (element, current, target) => {
  element.classList.remove('hint-satisfied', 'hint-exceeded');
  if (current === target) {
    element.classList.add('hint-satisfied');
  } else if (current > target) {
    element.classList.add('hint-exceeded');
  }
};

const updateMessage = (text) => {
  messageElement.textContent = text;
};

const updateCell = (row, column) => {
  const element = cellElements[row][column];
  const stateValue = state.boardState[row][column];
  element.dataset.state = stateValue;
  if (stateValue === 'fruit') {
    element.textContent = '🍎';
  } else if (stateValue === 'mark') {
    element.textContent = '✕';
  } else {
    element.textContent = '';
  }
};

const updateHints = () => {
  const currentRowTotals = getCurrentRowTotals();
  const currentColumnTotals = getCurrentColumnTotals();

  currentRowTotals.forEach((count, index) => {
    const element = rowHintElements[index];
    element.textContent = state.puzzle.rowTotals[index];
    applyHintClasses(element, count, state.puzzle.rowTotals[index]);
  });

  currentColumnTotals.forEach((count, index) => {
    const element = columnHintElements[index];
    element.textContent = state.puzzle.columnTotals[index];
    applyHintClasses(element, count, state.puzzle.columnTotals[index]);
  });
};

const updateBoard = () => {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      updateCell(row, column);
    }
  }
  updateHints();
};

const cycleCell = (row, column) => {
  const currentState = state.boardState[row][column];
  const nextState = CELL_STATES[(CELL_STATES.indexOf(currentState) + 1) % CELL_STATES.length];
  state.boardState[row][column] = nextState;
  updateCell(row, column);
  updateHints();
};

const resetBoard = () => {
  state.boardState = createEmptyBoard(BOARD_SIZE);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      updateCell(row, column);
    }
  }
  updateHints();
  updateMessage('Board cleared. Rebuild the harvest so each shape and every clue lines up.');
};

const createBoardStructure = () => {
  columnHintElements.length = 0;
  columnHintsContainer.innerHTML = '';
  state.puzzle.columnTotals.forEach((total, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'column-hint-cell';
    const text = document.createElement('span');
    text.className = 'hint-text';
    text.textContent = total;
    wrapper.appendChild(text);
    columnHintsContainer.appendChild(wrapper);
    columnHintElements[index] = text;
  });

  boardContainer.innerHTML = '';
  cellElements.length = 0;
  rowHintElements.length = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'board-row';

    const cellRow = document.createElement('div');
    cellRow.className = 'row-cells';
    const rowCells = [];

    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const regionId = state.puzzle.regionGrid[row][column];
      const region = state.puzzle.regionsById[String(regionId)];

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.row = row;
      button.dataset.column = column;
      button.dataset.state = 'empty';
      button.dataset.region = regionId;
      button.style.setProperty('--region-color', region.color);
      button.setAttribute(
        'aria-label',
        `Row ${row + 1}, column ${column + 1}. Part of a shape needing ${region.requirement} apples.`
      );

      if (region.anchor[0] === row && region.anchor[1] === column) {
        button.dataset.requirement = region.requirement;
      }

      cellRow.appendChild(button);
      rowCells[column] = button;
    }

    const hintWrapper = document.createElement('div');
    hintWrapper.className = 'row-hint-cell';
    const hintText = document.createElement('span');
    hintText.className = 'hint-text';
    hintText.textContent = state.puzzle.rowTotals[row];
    hintWrapper.appendChild(hintText);

    rowHintElements[row] = hintText;
    cellElements[row] = rowCells;

    rowWrapper.appendChild(cellRow);
    rowWrapper.appendChild(hintWrapper);
    boardContainer.appendChild(rowWrapper);
  }
};

const checkSolution = () => {
  const { rowTotals, columnTotals, regionGrid, regions } = state.puzzle;

  const currentRowTotals = getCurrentRowTotals();
  const currentColumnTotals = getCurrentColumnTotals();

  const rowsMatch = currentRowTotals.every((count, index) => count === rowTotals[index]);
  const columnsMatch = currentColumnTotals.every((count, index) => count === columnTotals[index]);

  const regionCounts = new Map();
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (state.boardState[row][column] === 'fruit') {
        const regionId = regionGrid[row][column];
        regionCounts.set(regionId, (regionCounts.get(regionId) || 0) + 1);
      }
    }
  }

  const regionsMatch = regions.every((region) => {
    const count = regionCounts.get(region.id) || 0;
    return count === region.requirement;
  });

  if (rowsMatch && columnsMatch && regionsMatch) {
    updateMessage(
      'Brilliant! Every shape has the right harvest and the row and column clues are all satisfied.'
    );
  } else {
    updateMessage('Not quite there. Check the shape requirements and the row and column counts.');
  }
};

const newPuzzle = () => {
  state.puzzle = createPuzzle();
  state.boardState = createEmptyBoard(BOARD_SIZE);
  createBoardStructure();
  updateBoard();
  updateMessage(
    'New layout! Each colored shape badge shows how many apples belong inside. Balance the rows and columns to match the clues.'
  );
};

boardContainer.addEventListener('click', (event) => {
  const target = event.target.closest('.cell');
  if (!target || !boardContainer.contains(target)) {
    return;
  }
  const row = Number(target.dataset.row);
  const column = Number(target.dataset.column);
  cycleCell(row, column);
});

checkButton.addEventListener('click', checkSolution);
clearButton.addEventListener('click', resetBoard);
newButton.addEventListener('click', newPuzzle);

createBoardStructure();
updateBoard();
