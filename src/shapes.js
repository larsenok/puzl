const SHAPES_BOARD_SIZE = 8;

const SHAPE_BASES = [
  {
    name: 'Crag',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [0, 2],
      [0, 3]
    ]
  },
  {
    name: 'Fjord',
    cells: [
      [2, 1],
      [3, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3]
    ]
  }
];

const getLuminance = (hexColor) => {
  if (typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
    return null;
  }
  const normalized = hexColor.replace('#', '').trim();
  if (normalized.length !== 6) {
    return null;
  }
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return null;
  }
  const [r, g, b] = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const filterDarkColors = (colors, minimumLuminance = 0.3) =>
  colors.filter((color) => {
    const luminance = getLuminance(color);
    return luminance === null || luminance >= minimumLuminance;
  });

const createShapesBoardLayout = () => {
  const size = SHAPES_BOARD_SIZE;
  const blockSize = 4;
  const layout = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  const shapes = SHAPE_BASES.map((shape) => shape.cells);
  const rotateCell = ([x, y]) => [blockSize - 1 - y, x];
  const rotateCells = (cells, rotations) => {
    let result = cells;
    for (let rotation = 0; rotation < rotations; rotation += 1) {
      result = result.map(rotateCell);
    }
    return result;
  };

  let pieceIndex = 0;
  for (let blockRow = 0; blockRow < size; blockRow += blockSize) {
    for (let blockColumn = 0; blockColumn < size; blockColumn += blockSize) {
      const rotations = Math.floor(Math.random() * 4);
      shapes.forEach((shapeCells) => {
        const rotatedCells = rotateCells(shapeCells, rotations);
        rotatedCells.forEach(([x, y]) => {
          layout[blockRow + y][blockColumn + x] = pieceIndex;
        });
        pieceIndex += 1;
      });
    }
  }

  return layout;
};

const createShapesBoardState = () =>
  Array.from({ length: SHAPES_BOARD_SIZE }, () =>
    Array.from({ length: SHAPES_BOARD_SIZE }, () => 'empty')
  );

const createShapesFlagState = (value = false) =>
  Array.from({ length: SHAPES_BOARD_SIZE }, () =>
    Array.from({ length: SHAPES_BOARD_SIZE }, () => value)
  );

const createShapesCountState = () =>
  Array.from({ length: SHAPES_BOARD_SIZE }, () =>
    Array.from({ length: SHAPES_BOARD_SIZE }, () => 0)
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
  requirementToggle,
  finishBanner,
  toggleButton,
  newGridButton,
  getPaletteColors,
  setBoardSize,
  onExit,
  onViewChange,
  initialView = 'puzzle'
}) => {
  let viewMode = initialView;
  let shapesBoardState = createShapesBoardState();
  let shapesBoardLayout = createShapesBoardLayout();
  let shapesPieceIds = [];
  const shapesCellElements = [];
  let autoMarkState = createShapesFlagState();
  let triangleNeighborCounts = createShapesCountState();
  let trianglesPlaced = 0;
  const triangleRequirement = 2;

  const setAppViewAttribute = (nextView) => {
    if (appRoot) {
      appRoot.dataset.view = nextView;
    }
  };

  const getShapesPalette = () => {
    const colors = getPaletteColors?.() || [];
    if (Array.isArray(colors) && colors.length >= 6) {
      const filteredColors = filterDarkColors(colors);
      if (filteredColors.length >= 6) {
        return filteredColors.slice(0, 6);
      }
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

  const updateRequirementToggle = () => {
    if (!requirementToggle) {
      return;
    }
    const label = `${triangleRequirement} triangles required`;
    requirementToggle.setAttribute('aria-label', label);
  };

  const updateFinishBanner = (nextSolved) => {
    if (!finishBanner) {
      return;
    }
    finishBanner.hidden = !nextSolved;
  };

  const isBoardSolved = () => {
    if (!shapesBoardLayout.length) {
      return false;
    }
    const size = SHAPES_BOARD_SIZE;
    for (let row = 0; row < size; row += 1) {
      let count = 0;
      for (let column = 0; column < size; column += 1) {
        if (shapesBoardState[row][column] === 'triangle') {
          count += 1;
        }
      }
      if (count !== triangleRequirement) {
        return false;
      }
    }

    for (let column = 0; column < size; column += 1) {
      let count = 0;
      for (let row = 0; row < size; row += 1) {
        if (shapesBoardState[row][column] === 'triangle') {
          count += 1;
        }
      }
      if (count !== triangleRequirement) {
        return false;
      }
    }

    const shapeCounts = new Map();
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        if (shapesBoardState[row][column] !== 'triangle') {
          continue;
        }
        const shapeId = shapesBoardLayout[row]?.[column];
        if (shapeId === null || shapeId === undefined) {
          continue;
        }
        shapeCounts.set(shapeId, (shapeCounts.get(shapeId) || 0) + 1);
      }
    }

    return shapesPieceIds.every(
      (shapeId) => (shapeCounts.get(shapeId) || 0) === triangleRequirement
    );
  };

  const updateSolvedState = () => {
    const minimumTriangles = triangleRequirement * SHAPES_BOARD_SIZE;
    if (trianglesPlaced < minimumTriangles) {
      updateFinishBanner(false);
      return;
    }
    updateFinishBanner(isBoardSolved());
  };

  const createShapesBoard = () => {
    setBoardSize?.(SHAPES_BOARD_SIZE);
    shapesCellElements.length = 0;
    shapesBoardState = createShapesBoardState();
    shapesBoardLayout = createShapesBoardLayout();
    shapesPieceIds = Array.from(
      new Set(shapesBoardLayout.flat().filter((value) => value != null))
    );
    autoMarkState = createShapesFlagState();
    triangleNeighborCounts = createShapesCountState();
    trianglesPlaced = 0;
    updateFinishBanner(false);
    if (columnHintsContainer) {
      columnHintsContainer.innerHTML = '';
    }
    if (boardContainer) {
      boardContainer.innerHTML = '';
      boardContainer.setAttribute('aria-label', 'Shapes board');
    }
    const palette = getShapesPalette();
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

  const setShapesCellMark = (row, column, mark, { auto = false } = {}) => {
    shapesBoardState[row][column] = mark;
    if (mark === 'x') {
      autoMarkState[row][column] = auto;
    } else {
      autoMarkState[row][column] = false;
    }
    const element = shapesCellElements[row]?.[column];
    if (element) {
      element.dataset.mark = mark;
    }
  };

  const updateTriangleInfluence = (row, column, delta) => {
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
        triangleNeighborCounts[neighborRow][neighborColumn] = Math.max(
          0,
          triangleNeighborCounts[neighborRow][neighborColumn] + delta
        );
        if (delta > 0) {
          if (shapesBoardState[neighborRow][neighborColumn] === 'empty') {
            setShapesCellMark(neighborRow, neighborColumn, 'x', { auto: true });
          }
          continue;
        }
        if (
          triangleNeighborCounts[neighborRow][neighborColumn] === 0 &&
          shapesBoardState[neighborRow][neighborColumn] === 'x' &&
          autoMarkState[neighborRow][neighborColumn]
        ) {
          setShapesCellMark(neighborRow, neighborColumn, 'empty');
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
    onViewChange?.(nextView);
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
    const currentMark = shapesBoardState[row][column];
    if (currentMark === 'empty') {
      setShapesCellMark(row, column, 'x');
      return true;
    }
    if (currentMark === 'x') {
      setShapesCellMark(row, column, 'triangle');
      updateTriangleInfluence(row, column, 1);
      trianglesPlaced += 1;
      updateSolvedState();
      return true;
    }
    updateTriangleInfluence(row, column, -1);
    setShapesCellMark(row, column, 'empty');
    trianglesPlaced = Math.max(0, trianglesPlaced - 1);
    updateSolvedState();
    return true;
  };

  if (toggleButton) {
    toggleButton.addEventListener('click', toggleView);
  }
  if (newGridButton) {
    newGridButton.addEventListener('click', () => {
      if (viewMode === 'shapes') {
        createShapesBoard();
      }
    });
  }
  if (requirementToggle) {
    requirementToggle.addEventListener('click', () => {
      requirementToggle.setAttribute('aria-pressed', 'true');
    });
  }
  updateToggleButton();
  updateRequirementToggle();
  setAppViewAttribute(viewMode);
  if (viewMode === 'shapes') {
    createShapesBoard();
  }

  return {
    isActive: () => viewMode === 'shapes',
    handleBoardClick
  };
};
