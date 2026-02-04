const SHAPES_CONFIGS = [
  { requirement: 2, size: 8 },
  { requirement: 3, size: 12 }
];

const getShapesConfig = (requirement) =>
  SHAPES_CONFIGS.find((config) => config.requirement === requirement) || SHAPES_CONFIGS[0];

const PRESET_TRIANGLE_SOLUTIONS = new Map([
  [
    '12x3',
    [
      { row: 0, column: 1 },
      { row: 0, column: 3 },
      { row: 0, column: 5 },
      { row: 1, column: 7 },
      { row: 1, column: 9 },
      { row: 1, column: 11 },
      { row: 2, column: 1 },
      { row: 2, column: 3 },
      { row: 2, column: 5 },
      { row: 3, column: 7 },
      { row: 3, column: 9 },
      { row: 3, column: 11 },
      { row: 4, column: 1 },
      { row: 4, column: 3 },
      { row: 4, column: 5 },
      { row: 5, column: 7 },
      { row: 5, column: 9 },
      { row: 5, column: 11 },
      { row: 6, column: 0 },
      { row: 6, column: 2 },
      { row: 6, column: 4 },
      { row: 7, column: 6 },
      { row: 7, column: 8 },
      { row: 7, column: 10 },
      { row: 8, column: 0 },
      { row: 8, column: 2 },
      { row: 8, column: 4 },
      { row: 9, column: 6 },
      { row: 9, column: 8 },
      { row: 9, column: 10 },
      { row: 10, column: 0 },
      { row: 10, column: 2 },
      { row: 10, column: 4 },
      { row: 11, column: 6 },
      { row: 11, column: 8 },
      { row: 11, column: 10 }
    ]
  ]
]);

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

const createTriangleSolution = (size, requirement) => {
  const preset = PRESET_TRIANGLE_SOLUTIONS.get(`${size}x${requirement}`);
  if (preset) {
    return { trianglePositions: preset.map((position) => ({ ...position })) };
  }
  const maxAttempts = 200;
  const baseColumns = Array.from({ length: size }, (_, index) => index);

  const attemptPlacement = (randomize) => {
    const placements = Array.from({ length: size }, () => Array(size).fill(false));
    const trianglePositions = [];
    const columnCounts = Array(size).fill(0);

    const canReachTargets = (row) =>
      columnCounts.every(
        (count) =>
          count <= requirement && count + (size - row) * requirement >= requirement
      );

    const isSafe = (row, column) => {
      if (columnCounts[column] >= requirement) {
        return false;
      }
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
          if (rowOffset === 0 && columnOffset === 0) {
            continue;
          }
          const neighborRow = row + rowOffset;
          const neighborColumn = column + columnOffset;
          if (
            neighborRow < 0 ||
            neighborRow >= size ||
            neighborColumn < 0 ||
            neighborColumn >= size
          ) {
            continue;
          }
          if (placements[neighborRow][neighborColumn]) {
            return false;
          }
        }
      }
      return true;
    };

    const placeRow = (row) => {
      if (row === size) {
        return columnCounts.every((count) => count === requirement);
      }
      if (!canReachTargets(row)) {
        return false;
      }
      const columns = randomize ? shuffleArray(baseColumns) : baseColumns;
      const selectColumns = (startIndex, selections) => {
        if (selections.length === requirement) {
          return placeRow(row + 1);
        }
        for (let index = startIndex; index < columns.length; index += 1) {
          const column = columns[index];
          if (!isSafe(row, column)) {
            continue;
          }
          placements[row][column] = true;
          columnCounts[column] += 1;
          trianglePositions.push({ row, column });
          if (selectColumns(index + 1, selections.concat(column))) {
            return true;
          }
          placements[row][column] = false;
          columnCounts[column] -= 1;
          trianglePositions.pop();
        }
        return false;
      };

      return selectColumns(0, []);
    };

    return placeRow(0) ? trianglePositions : null;
  };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = attemptPlacement(true);
    if (result) {
      return { trianglePositions: result };
    }
  }

  const fallback = attemptPlacement(false);
  return { trianglePositions: fallback || [] };
};

const groupTriangleSeeds = (trianglePositions, groupSize) => {
  const shuffled = shuffleArray(trianglePositions);
  const groups = [];
  for (let index = 0; index < shuffled.length; index += groupSize) {
    groups.push(shuffled.slice(index, index + groupSize));
  }
  return groups;
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

const createShapesBoardLayout = (size, requirement) => {
  const totalCells = size * size;
  const maxAttempts = 120;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const layout = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
    const { trianglePositions } = createTriangleSolution(size, requirement);
    const groups = groupTriangleSeeds(trianglePositions, requirement);
    const shapes = groups.map((group, index) => ({
      id: index,
      cells: group.map((seed) => ({ ...seed }))
    }));

    groups.forEach((group, index) => {
      group.forEach((seed) => {
        layout[seed.row][seed.column] = index;
      });
    });

    const routingOrder = shuffleArray(shapes.map((shape) => shape.id));
    let routed = true;

    routingOrder.forEach((shapeId) => {
      if (!routed) {
        return;
      }
      const seeds = groups[shapeId];
      const anchor = seeds[0];
      for (let seedIndex = 1; seedIndex < seeds.length; seedIndex += 1) {
        const path = findPathBetween(anchor, seeds[seedIndex], layout, shapeId);
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
      }
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

const createShapesBoardState = (size) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty'));

const createShapesFlagState = (size, value = false) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => value));

const createShapesCountState = (size) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 0));

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
  requirementButtons = [],
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
  let triangleRequirement = getShapesConfig(2).requirement;
  let shapesBoardSize = getShapesConfig(triangleRequirement).size;
  let shapesBoardState = createShapesBoardState(shapesBoardSize);
  let shapesBoardLayout = createShapesBoardLayout(shapesBoardSize, triangleRequirement);
  let shapesPieceIds = [];
  const shapesCellElements = [];
  const shapesRowElements = [];
  let autoMarkState = createShapesFlagState(shapesBoardSize);
  let triangleNeighborCounts = createShapesCountState(shapesBoardSize);
  let trianglesPlaced = 0;

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
    if (!requirementButtons.length) {
      return;
    }
    requirementButtons.forEach((button) => {
      if (!button) {
        return;
      }
      const requirementValue = Number(button.dataset.requirement);
      const label = `${requirementValue} triangles required`;
      button.setAttribute('aria-label', label);
      button.setAttribute(
        'aria-pressed',
        requirementValue === triangleRequirement ? 'true' : 'false'
      );
    });
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
    const size = shapesBoardSize;
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
    const minimumTriangles = triangleRequirement * shapesBoardSize;
    if (trianglesPlaced < minimumTriangles) {
      updateFinishBanner(false);
      return;
    }
    updateFinishBanner(isBoardSolved());
  };

  const updateErrorHighlights = () => {
    const size = shapesBoardSize;
    const rowCounts = Array(size).fill(0);
    const columnCounts = Array(size).fill(0);
    const shapeCounts = new Map();

    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        if (shapesBoardState[row][column] !== 'triangle') {
          continue;
        }
        rowCounts[row] += 1;
        columnCounts[column] += 1;
        const shapeId = shapesBoardLayout[row]?.[column];
        if (shapeId !== null && shapeId !== undefined) {
          shapeCounts.set(shapeId, (shapeCounts.get(shapeId) || 0) + 1);
        }
      }
    }

    const rowOverLimit = rowCounts.map((count) => count > triangleRequirement);
    const columnOverLimit = columnCounts.map((count) => count > triangleRequirement);
    const shapeOverLimit = new Map(
      shapesPieceIds.map((shapeId) => [
        shapeId,
        (shapeCounts.get(shapeId) || 0) > triangleRequirement
      ])
    );

    for (let row = 0; row < size; row += 1) {
      const rowElement = shapesRowElements[row];
      if (rowElement) {
        if (rowOverLimit[row]) {
          rowElement.dataset.errorRow = 'true';
        } else {
          delete rowElement.dataset.errorRow;
        }
      }
      for (let column = 0; column < size; column += 1) {
        const cellElement = shapesCellElements[row]?.[column];
        if (!cellElement) {
          continue;
        }
        if (rowOverLimit[row]) {
          cellElement.dataset.errorRow = 'true';
        } else {
          delete cellElement.dataset.errorRow;
        }
        if (columnOverLimit[column]) {
          cellElement.dataset.errorColumn = 'true';
        } else {
          delete cellElement.dataset.errorColumn;
        }
        const shapeId = shapesBoardLayout[row]?.[column];
        if (shapeId !== null && shapeId !== undefined && shapeOverLimit.get(shapeId)) {
          cellElement.dataset.errorShape = 'true';
        } else {
          delete cellElement.dataset.errorShape;
        }
      }
    }
  };

  const createShapesBoard = () => {
    setBoardSize?.(shapesBoardSize);
    shapesCellElements.length = 0;
    shapesRowElements.length = 0;
    shapesBoardState = createShapesBoardState(shapesBoardSize);
    shapesBoardLayout = createShapesBoardLayout(shapesBoardSize, triangleRequirement);
    shapesPieceIds = Array.from(
      new Set(shapesBoardLayout.flat().filter((value) => value != null))
    );
    autoMarkState = createShapesFlagState(shapesBoardSize);
    triangleNeighborCounts = createShapesCountState(shapesBoardSize);
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

    for (let row = 0; row < shapesBoardSize; row += 1) {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'board-row';

      const cellRow = document.createElement('div');
      cellRow.className = 'row-cells';
      const rowCells = [];

      for (let column = 0; column < shapesBoardSize; column += 1) {
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
      shapesRowElements[row] = rowWrapper;
      boardContainer?.appendChild(rowWrapper);
    }
    updateErrorHighlights();
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
          neighborRow >= shapesBoardSize ||
          neighborColumn < 0 ||
          neighborColumn >= shapesBoardSize
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
      updateErrorHighlights();
      updateSolvedState();
      return true;
    }
    updateTriangleInfluence(row, column, -1);
    setShapesCellMark(row, column, 'empty');
    trianglesPlaced = Math.max(0, trianglesPlaced - 1);
    updateErrorHighlights();
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
  requirementButtons.forEach((button) => {
    if (!button) {
      return;
    }
    button.addEventListener('click', () => {
      const requirementValue = Number(button.dataset.requirement);
      if (!Number.isInteger(requirementValue)) {
        return;
      }
      const config = getShapesConfig(requirementValue);
      triangleRequirement = config.requirement;
      shapesBoardSize = config.size;
      updateRequirementToggle();
      if (viewMode === 'shapes') {
        createShapesBoard();
      }
    });
  });
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
