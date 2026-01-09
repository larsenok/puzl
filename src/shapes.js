const SHAPES_BOARD_SIZE = 8;

const shuffleArray = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

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

const createTriangleSolution = (size) => {
  const baseColumns = Array.from({ length: size }, (_, index) => index);
  const firstPermutation = shuffleArray(baseColumns);
  let secondPermutation = shuffleArray(baseColumns);
  let attempts = 0;
  while (
    attempts < 50 &&
    secondPermutation.some((column, row) => column === firstPermutation[row])
  ) {
    secondPermutation = shuffleArray(baseColumns);
    attempts += 1;
  }
  if (secondPermutation.some((column, row) => column === firstPermutation[row])) {
    secondPermutation = [...firstPermutation.slice(1), firstPermutation[0]];
  }

  const trianglePositions = [];

  for (let row = 0; row < size; row += 1) {
    const firstColumn = firstPermutation[row];
    const secondColumn = secondPermutation[row];
    trianglePositions.push({ row, column: firstColumn });
    trianglePositions.push({ row, column: secondColumn });
  }

  return { trianglePositions };
};

const pairTriangleSeeds = (trianglePositions) => {
  const shuffled = shuffleArray(trianglePositions);
  const pairs = [];
  for (let index = 0; index < shuffled.length; index += 2) {
    pairs.push([shuffled[index], shuffled[index + 1]]);
  }
  return pairs;
};

const findPathBetween = (start, end, layout, shapeId) => {
  const size = layout.length;
  const queue = [start];
  const visited = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const previous = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  visited[start.row][start.column] = true;

  while (queue.length) {
    const current = queue.shift();
    if (current.row === end.row && current.column === end.column) {
      const path = [];
      let cursor = current;
      while (cursor) {
        path.push(cursor);
        cursor = previous[cursor.row][cursor.column];
      }
      return path.reverse();
    }

    directions.forEach(([rowOffset, columnOffset]) => {
      const neighborRow = current.row + rowOffset;
      const neighborColumn = current.column + columnOffset;
      if (
        neighborRow < 0 ||
        neighborRow >= size ||
        neighborColumn < 0 ||
        neighborColumn >= size
      ) {
        return;
      }
      if (visited[neighborRow][neighborColumn]) {
        return;
      }
      const occupant = layout[neighborRow][neighborColumn];
      if (occupant !== null && occupant !== shapeId) {
        return;
      }
      visited[neighborRow][neighborColumn] = true;
      previous[neighborRow][neighborColumn] = current;
      queue.push({ row: neighborRow, column: neighborColumn });
    });
  }

  return null;
};

const createShapeTargets = (minSizes, totalCells) => {
  const maxSize = 14;
  const sizes = [...minSizes];
  let remaining = totalCells - sizes.reduce((sum, value) => sum + value, 0);

  while (remaining > 0) {
    const index = Math.floor(Math.random() * sizes.length);
    if (sizes[index] < maxSize) {
      sizes[index] += 1;
      remaining -= 1;
    }
  }

  if (Math.max(...sizes) < Math.min(...sizes) + 3) {
    const receiver = Math.floor(Math.random() * sizes.length);
    const donor = sizes.findIndex((value, index) => value > minSizes[index] && index !== receiver);
    if (donor >= 0) {
      sizes[donor] -= 1;
      sizes[receiver] += 1;
    }
  }

  return sizes;
};

const collectFrontierCells = (layout, cells) => {
  const size = layout.length;
  const frontier = new Set();
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  cells.forEach(({ row, column }) => {
    directions.forEach(([rowOffset, columnOffset]) => {
      const neighborRow = row + rowOffset;
      const neighborColumn = column + columnOffset;
      if (
        neighborRow < 0 ||
        neighborRow >= size ||
        neighborColumn < 0 ||
        neighborColumn >= size
      ) {
        return;
      }
      if (layout[neighborRow][neighborColumn] !== null) {
        return;
      }
      frontier.add(`${neighborRow},${neighborColumn}`);
    });
  });

  return Array.from(frontier, (value) => {
    const [row, column] = value.split(',').map((entry) => Number(entry));
    return { row, column };
  });
};

const createShapesBoardLayout = () => {
  const size = SHAPES_BOARD_SIZE;
  const totalCells = size * size;
  const maxAttempts = 120;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const layout = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
    const { trianglePositions } = createTriangleSolution(size);
    const pairs = pairTriangleSeeds(trianglePositions);
    const shapes = pairs.map((pair, index) => ({
      id: index,
      cells: pair.map((seed) => ({ ...seed }))
    }));

    pairs.forEach(([first, second], index) => {
      layout[first.row][first.column] = index;
      layout[second.row][second.column] = index;
    });

    const routingOrder = shuffleArray(shapes.map((shape) => shape.id));
    let routed = true;

    routingOrder.forEach((shapeId) => {
      if (!routed) {
        return;
      }
      const [start, end] = pairs[shapeId];
      const path = findPathBetween(start, end, layout, shapeId);
      if (!path) {
        routed = false;
        return;
      }
      path.forEach((cell) => {
        if (layout[cell.row][cell.column] === null) {
          layout[cell.row][cell.column] = shapeId;
          shapes[shapeId].cells.push(cell);
        }
      });
    });

    if (!routed) {
      continue;
    }

    const minSizes = shapes.map((shape) => shape.cells.length);
    const targets = createShapeTargets(minSizes, totalCells);
    let remainingCells = totalCells - minSizes.reduce((sum, value) => sum + value, 0);
    let safetyCounter = totalCells * 20;

    while (remainingCells > 0 && safetyCounter > 0) {
      safetyCounter -= 1;
      const candidates = shapes
        .map((shape, index) => ({
          shape,
          index,
          frontier: collectFrontierCells(layout, shape.cells)
        }))
        .filter(
          ({ shape, index, frontier }) =>
            frontier.length > 0 && shape.cells.length < targets[index]
        );
      const fallbackCandidates =
        candidates.length > 0
          ? candidates
          : shapes
              .map((shape, index) => ({
                shape,
                index,
                frontier: collectFrontierCells(layout, shape.cells)
              }))
              .filter(({ frontier }) => frontier.length > 0);

      if (!fallbackCandidates.length) {
        break;
      }

      const pick = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
      const frontierCell = pick.frontier[Math.floor(Math.random() * pick.frontier.length)];
      layout[frontierCell.row][frontierCell.column] = pick.shape.id;
      pick.shape.cells.push(frontierCell);
      remainingCells -= 1;
    }

    if (remainingCells === 0) {
      return layout;
    }
  }

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, () => row)
  );
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
    const neighborOffsets = [-1, 0, 1];
    const hasAdjacentTriangle = (row, column) =>
      neighborOffsets.some((rowOffset) =>
        neighborOffsets.some((columnOffset) => {
          if (rowOffset === 0 && columnOffset === 0) {
            return false;
          }
          const neighborRow = row + rowOffset;
          const neighborColumn = column + columnOffset;
          if (
            neighborRow < 0 ||
            neighborRow >= size ||
            neighborColumn < 0 ||
            neighborColumn >= size
          ) {
            return false;
          }
          return shapesBoardState[neighborRow][neighborColumn] === 'triangle';
        })
      );
    for (let row = 0; row < size; row += 1) {
      let count = 0;
      for (let column = 0; column < size; column += 1) {
        if (shapesBoardState[row][column] === 'triangle') {
          if (hasAdjacentTriangle(row, column)) {
            return false;
          }
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
      if (triangleNeighborCounts[row][column] > 0) {
        return false;
      }
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
