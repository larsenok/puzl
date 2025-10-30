const BOARD_SIZE = 5;
const CELL_STATES = ['empty', 'fruit', 'mark'];

const createEmptyBoard = (size) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty'));

const createPuzzle = (size = BOARD_SIZE) => {
  let grid = [];
  let rowTotals = [];
  let columnTotals = [];

  do {
    const density = 0.35 + Math.random() * 0.25;
    grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => Math.random() < density)
    );
    rowTotals = grid.map((row) => row.filter(Boolean).length);
    columnTotals = Array.from({ length: size }, (_, column) =>
      grid.reduce((sum, row) => sum + (row[column] ? 1 : 0), 0)
    );
  } while (
    rowTotals.every((count) => count === 0) || columnTotals.every((count) => count === 0)
  );

  return { solution: grid, rowTotals, columnTotals };
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
  element.className = `cell cell_${stateValue}`;
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
  updateMessage('Cleared the orchard. Try matching every row and column count again!');
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
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell cell_empty';
      button.dataset.row = row;
      button.dataset.column = column;
      button.setAttribute('aria-label', `Plot row ${row + 1}, column ${column + 1}`);
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
  const { solution, rowTotals, columnTotals } = state.puzzle;
  let allCorrect = true;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const shouldHaveFruit = solution[row][column];
      const hasFruit = state.boardState[row][column] === 'fruit';
      if (shouldHaveFruit !== hasFruit) {
        allCorrect = false;
      }
    }
  }

  const currentRowTotals = getCurrentRowTotals();
  const currentColumnTotals = getCurrentColumnTotals();

  const rowsMatch = currentRowTotals.every((count, index) => count === rowTotals[index]);
  const columnsMatch = currentColumnTotals.every((count, index) => count === columnTotals[index]);

  if (allCorrect && rowsMatch && columnsMatch) {
    updateMessage('Perfect harvest! You matched every clue exactly. Tap "New Puzzle" to explore another grove.');
  } else {
    updateMessage('Not quite ripe yet. Double-check the counts and try again.');
  }
};

const newPuzzle = () => {
  state.puzzle = createPuzzle();
  state.boardState = createEmptyBoard(BOARD_SIZE);
  createBoardStructure();
  updateBoard();
  updateMessage('New grove discovered! Use the row and column counts to place the apples.');
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
