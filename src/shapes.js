const SHAPES_BOARD_SIZE = 8;

const SHAPE_BASES = [
  { name: 'I', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { name: 'O', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { name: 'T', cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { name: 'S', cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  { name: 'Z', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { name: 'J', cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { name: 'L', cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  { name: 'P', cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] },
  { name: 'U', cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]] }
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

const SHAPE_VARIANTS = SHAPE_BASES.flatMap((shape) =>
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
  const maxAttempts = 200;

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
    const variants = shuffleArray(SHAPE_VARIANTS);

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
    Array.from({ length: SHAPES_BOARD_SIZE }, () => 'empty')
  );

const defaultShapesPalette = () => [
  '#ef4444',
  '#f59e0b',
  '#facc15',
  '#22c55e',
  '#0ea5e9',
  '#a855f7'
];

const buildAdjacencyMap = (layout) => {
  const adjacency = new Map();
  const registerEdge = (from, to) => {
    if (!adjacency.has(from)) {
      adjacency.set(from, new Set());
    }
    adjacency.get(from).add(to);
  };

  for (let row = 0; row < layout.length; row += 1) {
    for (let column = 0; column < layout[row].length; column += 1) {
      const current = layout[row][column];
      if (current === null || current === undefined) {
        continue;
      }
      if (!adjacency.has(current)) {
        adjacency.set(current, new Set());
      }
      const neighbors = [
        [row + 1, column],
        [row, column + 1]
      ];
      neighbors.forEach(([neighborRow, neighborColumn]) => {
        const neighbor = layout[neighborRow]?.[neighborColumn];
        if (neighbor !== null && neighbor !== undefined && neighbor !== current) {
          registerEdge(current, neighbor);
          registerEdge(neighbor, current);
        }
      });
    }
  }

  return adjacency;
};

const assignShapeColors = (layout, palette) => {
  const adjacency = buildAdjacencyMap(layout);
  const pieces = Array.from(adjacency.keys()).sort(
    (a, b) => adjacency.get(b).size - adjacency.get(a).size
  );
  const assignments = new Map();

  pieces.forEach((piece) => {
    const usedColors = new Set(
      Array.from(adjacency.get(piece) || [])
        .map((neighbor) => assignments.get(neighbor))
        .filter(Boolean)
    );
    const color = palette.find((candidate) => !usedColors.has(candidate)) || palette[0];
    assignments.set(piece, color);
  });

  return assignments;
};

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
    const shapeColors = assignShapeColors(shapesBoardLayout, palette);

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
        button.dataset.mark = shapesBoardState[row][column];
        const shapeIndex = shapesBoardLayout[row]?.[column];
        const shapeColor =
          shapeColors.get(shapeIndex) || palette[(shapeIndex ?? 0) % palette.length];
        button.style.setProperty('--shape-color', shapeColor);
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

  const setShapesCellMark = (row, column, mark) => {
    shapesBoardState[row][column] = mark;
    const element = shapesCellElements[row]?.[column];
    if (element) {
      element.dataset.mark = mark;
    }
  };

  const markSurroundingCells = (row, column) => {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue;
        }
        const neighborRow = row + rowOffset;
        const neighborColumn = column + columnOffset;
        if (
          neighborRow < 0 ||
          neighborRow >= SHAPES_BOARD_SIZE ||
          neighborColumn < 0 ||
          neighborColumn >= SHAPES_BOARD_SIZE
        ) {
          continue;
        }
        if (shapesBoardState[neighborRow][neighborColumn] === 'empty') {
          setShapesCellMark(neighborRow, neighborColumn, 'x');
        }
      }
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
    setShapesCellMark(row, column, 'triangle');
    markSurroundingCells(row, column);
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
