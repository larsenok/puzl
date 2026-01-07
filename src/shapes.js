const SHAPES_BOARD_SIZE = 6;
const SHAPES_BOARD_LAYOUT = [
  [0, 0, 1, 1, 2, 2],
  [0, 0, 1, 1, 2, 2],
  [3, 3, 4, 4, 5, 5],
  [3, 3, 4, 4, 5, 5],
  [1, 1, 2, 2, 0, 0],
  [1, 1, 2, 2, 0, 0]
];

const createShapesBoardState = () =>
  Array.from({ length: SHAPES_BOARD_SIZE }, () =>
    Array.from({ length: SHAPES_BOARD_SIZE }, () => false)
  );

const defaultShapesPalette = () => [
  '#ef4444',
  '#f59e0b',
  '#facc15',
  '#22c55e',
  '#0ea5e9',
  '#a855f7'
];

export const createShapesView = ({
  appRoot,
  boardContainer,
  columnHintsContainer,
  toggleButton,
  getPaletteColors,
  setBoardSize,
  onExit
}) => {
  let viewMode = 'puzzle';
  const shapesBoardState = createShapesBoardState();
  const shapesCellElements = [];

  const setAppViewAttribute = (nextView) => {
    if (appRoot) {
      appRoot.dataset.view = nextView;
    }
  };

  const getShapesPalette = () => {
    const colors = getPaletteColors?.() || [];
    if (Array.isArray(colors) && colors.length >= 6) {
      return colors.slice(0, 6);
    }
    return defaultShapesPalette();
  };

  const updateToggleButton = () => {
    if (!toggleButton) {
      return;
    }
    const label = viewMode === 'shapes' ? 'Return to game board' : 'Show shapes board';
    toggleButton.setAttribute('aria-label', label);
    toggleButton.setAttribute('title', label);
  };

  const createShapesBoard = () => {
    setBoardSize?.(SHAPES_BOARD_SIZE);
    shapesCellElements.length = 0;
    if (columnHintsContainer) {
      columnHintsContainer.innerHTML = '';
    }
    if (boardContainer) {
      boardContainer.innerHTML = '';
      boardContainer.setAttribute('aria-label', 'Shapes board');
    }
    const palette = getShapesPalette();

    for (let row = 0; row < SHAPES_BOARD_SIZE; row += 1) {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'board-row';

      const cellRow = document.createElement('div');
      cellRow.className = 'row-cells';
      const rowCells = [];

      for (let column = 0; column < SHAPES_BOARD_SIZE; column += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cell shapes-cell';
        button.dataset.row = row;
        button.dataset.column = column;
        button.dataset.active = String(shapesBoardState[row][column]);
        const colorIndex = SHAPES_BOARD_LAYOUT[row]?.[column] ?? 0;
        button.style.setProperty('--shape-color', palette[colorIndex % palette.length]);
        button.setAttribute(
          'aria-label',
          `Shape cell row ${row + 1}, column ${column + 1}`
        );
        cellRow.appendChild(button);
        rowCells[column] = button;
      }

      rowWrapper.appendChild(cellRow);
      shapesCellElements[row] = rowCells;
      boardContainer?.appendChild(rowWrapper);
    }
  };

  const toggleShapesCell = (row, column) => {
    const nextValue = !shapesBoardState[row][column];
    shapesBoardState[row][column] = nextValue;
    const element = shapesCellElements[row]?.[column];
    if (element) {
      element.dataset.active = String(nextValue);
    }
  };

  const setViewMode = (nextView) => {
    if (viewMode === nextView) {
      return;
    }
    viewMode = nextView;
    setAppViewAttribute(nextView);
    updateToggleButton();
    if (viewMode === 'shapes') {
      createShapesBoard();
      return;
    }
    onExit?.();
  };

  const toggleView = () => {
    setViewMode(viewMode === 'shapes' ? 'puzzle' : 'shapes');
  };

  const handleBoardClick = (row, column) => {
    if (viewMode !== 'shapes') {
      return false;
    }
    toggleShapesCell(row, column);
    return true;
  };

  if (toggleButton) {
    toggleButton.addEventListener('click', toggleView);
  }
  updateToggleButton();
  setAppViewAttribute(viewMode);

  return {
    isActive: () => viewMode === 'shapes',
    handleBoardClick
  };
};
