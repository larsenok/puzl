const SHAPES_BOARD_SIZE = 8;

const TETROMINO_BASES = [
  { name: 'I', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { name: 'O', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { name: 'T', cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { name: 'S', cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  { name: 'Z', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { name: 'J', cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { name: 'L', cells: [[2, 0], [0, 1], [1, 1], [2, 1]] }
];

const normalizeCells = (cells) => {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells
    .map(([x, y]) => [x - minX, y - minY])
    .sort((a, b) => (a[1] - b[1] ? a[1] - b[1] : a[0] - b[0]));
};

const rotateCells = (cells) => normalizeCells(cells.map(([x, y]) => [y, -x]));

const buildRotations = (cells) => {
  const rotations = [];
  let current = normalizeCells(cells);
  for (let rotation = 0; rotation < 4; rotation += 1) {
    const signature = JSON.stringify(current);
    if (!rotations.some((entry) => JSON.stringify(entry) === signature)) {
      rotations.push(current);
    }
    current = rotateCells(current);
  }
  return rotations;
};

const TETROMINO_VARIANTS = TETROMINO_BASES.flatMap((shape) =>
  buildRotations(shape.cells).map((cells) => ({ shape: shape.name, cells }))
);

const shuffleArray = (items) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const createShapesBoardLayout = () => {
  const size = SHAPES_BOARD_SIZE;
  const maxAttempts = 60;

  const makeEmptyLayout = () =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => null));

  const findNextEmpty = (layout) => {
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        if (layout[row][column] === null) {
          return [row, column];
        }
      }
    }
    return null;
  };

  const canPlace = (layout, originRow, originColumn, cells) =>
    cells.every(([x, y]) => {
      const row = originRow + y;
      const column = originColumn + x;
      return (
        row >= 0 &&
        row < size &&
        column >= 0 &&
        column < size &&
        layout[row][column] === null
      );
    });

  const placeCells = (layout, originRow, originColumn, cells, value) => {
    cells.forEach(([x, y]) => {
      layout[originRow + y][originColumn + x] = value;
    });
  };

  const fillLayout = (layout, pieceIndex) => {
    const next = findNextEmpty(layout);
    if (!next) {
      return true;
    }
    const [startRow, startColumn] = next;
    const variants = shuffleArray(TETROMINO_VARIANTS);

    for (const variant of variants) {
      for (const [anchorX, anchorY] of variant.cells) {
        const originRow = startRow - anchorY;
        const originColumn = startColumn - anchorX;
        if (!canPlace(layout, originRow, originColumn, variant.cells)) {
          continue;
        }
        placeCells(layout, originRow, originColumn, variant.cells, pieceIndex);
        if (fillLayout(layout, pieceIndex + 1)) {
          return true;
        }
        placeCells(layout, originRow, originColumn, variant.cells, null);
      }
    }
    return false;
  };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const layout = makeEmptyLayout();
    if (fillLayout(layout, 0)) {
      return layout;
    }
  }

  return makeEmptyLayout();
};

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
  let shapesBoardState = createShapesBoardState();
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
    shapesBoardState = createShapesBoardState();
    if (columnHintsContainer) {
      columnHintsContainer.innerHTML = '';
    }
    if (boardContainer) {
      boardContainer.innerHTML = '';
      boardContainer.setAttribute('aria-label', 'Shapes board');
    }
    const palette = getShapesPalette();
    const shapesBoardLayout = createShapesBoardLayout();

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
        const colorIndex = shapesBoardLayout[row]?.[column] ?? 0;
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
