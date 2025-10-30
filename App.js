import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const BOARD_SIZE = 5;
const CELL_STATES = ['empty', 'fruit', 'mark'];
const HINT_COLUMN_WIDTH = 52;

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

export default function App() {
  const [puzzle, setPuzzle] = useState(() => createPuzzle());
  const [boardState, setBoardState] = useState(() => createEmptyBoard(BOARD_SIZE));
  const [message, setMessage] = useState(
    'Welcome to Star Orchard! Fill the orchard with apples so every row and column matches the clue counts.'
  );

  const { width } = useWindowDimensions();
  const availableWidth = Math.max(width - 32, 260);
  const boardSide = Math.min(availableWidth, 420);
  const cellSize = boardSide / BOARD_SIZE;

  const currentRowTotals = useMemo(
    () => boardState.map((row) => row.filter((cell) => cell === 'fruit').length),
    [boardState]
  );

  const currentColumnTotals = useMemo(() => {
    return Array.from({ length: BOARD_SIZE }, (_, column) =>
      boardState.reduce((sum, row) => sum + (row[column] === 'fruit' ? 1 : 0), 0)
    );
  }, [boardState]);

  const cycleCell = useCallback((rowIndex, columnIndex) => {
    setBoardState((previous) => {
      const next = previous.map((row) => [...row]);
      const currentState = previous[rowIndex][columnIndex];
      const nextState = CELL_STATES[(CELL_STATES.indexOf(currentState) + 1) % CELL_STATES.length];
      next[rowIndex][columnIndex] = nextState;
      return next;
    });
  }, []);

  const resetBoard = useCallback(() => {
    setBoardState(createEmptyBoard(BOARD_SIZE));
    setMessage('Cleared the orchard. Try matching every row and column count again!');
  }, []);

  const newPuzzle = useCallback(() => {
    setPuzzle(createPuzzle());
    setBoardState(createEmptyBoard(BOARD_SIZE));
    setMessage('New grove discovered! Use the row and column counts to place the apples.');
  }, []);

  const checkSolution = useCallback(() => {
    const { solution, rowTotals, columnTotals } = puzzle;
    let allCorrect = true;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let column = 0; column < BOARD_SIZE; column += 1) {
        const shouldHaveFruit = solution[row][column];
        const hasFruit = boardState[row][column] === 'fruit';
        if (shouldHaveFruit !== hasFruit) {
          allCorrect = false;
        }
      }
    }

    const rowsMatch = currentRowTotals.every((count, index) => count === rowTotals[index]);
    const columnsMatch = currentColumnTotals.every((count, index) => count === columnTotals[index]);

    if (allCorrect && rowsMatch && columnsMatch) {
      setMessage('Perfect harvest! You matched every clue exactly. Tap "New Puzzle" to explore another grove.');
    } else {
      setMessage('Not quite ripe yet. Double-check the counts and try again.');
    }
  }, [boardState, currentColumnTotals, currentRowTotals, puzzle]);

  const hintStyleFor = useCallback((current, target) => {
    if (current === target) {
      return styles.hintSatisfied;
    }
    if (current > target) {
      return styles.hintExceeded;
    }
    return null;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Star Orchard</Text>
        <Text style={styles.subtitle}>
          Tap a patch to cycle between empty ground, an apple (🍎), and a marker (✕). Use the clues to fill the
          orchard so each row and column has the exact number of apples indicated.
        </Text>

        <View style={styles.boardSection}>
          <View style={[styles.columnHints, { marginLeft: HINT_COLUMN_WIDTH, width: boardSide }]}>
            {puzzle.columnTotals.map((count, index) => (
              <View key={`column-hint-${index}`} style={[styles.columnHintCell, { width: cellSize }]}>
                <Text style={[styles.hintText, hintStyleFor(currentColumnTotals[index], count)]}>{count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.boardContainer}>
            {puzzle.solution.map((_, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.boardRow}>
                <View style={[styles.rowHintCell, { width: HINT_COLUMN_WIDTH }]}>
                  <Text style={[styles.hintText, hintStyleFor(currentRowTotals[rowIndex], puzzle.rowTotals[rowIndex])]}>
                    {puzzle.rowTotals[rowIndex]}
                  </Text>
                </View>
                <View style={[styles.rowCells, { width: boardSide }]}>
                  {puzzle.solution[rowIndex].map((__, columnIndex) => (
                    <Pressable
                      key={`cell-${rowIndex}-${columnIndex}`}
                      onPress={() => cycleCell(rowIndex, columnIndex)}
                      style={({ pressed }) => [
                        styles.cell,
                        { width: cellSize, height: cellSize },
                        styles[`cell_${boardState[rowIndex][columnIndex]}`],
                        pressed && styles.cellPressed
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Cell ${rowIndex + 1}, ${columnIndex + 1}`}
                    >
                      <Text style={styles.cellEmoji}>
                        {boardState[rowIndex][columnIndex] === 'fruit'
                          ? '🍎'
                          : boardState[rowIndex][columnIndex] === 'mark'
                          ? '✕'
                          : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          <ActionButton label="Check Solution" onPress={checkSolution} />
          <ActionButton label="Clear Board" onPress={resetBoard} />
          <ActionButton label="New Puzzle" onPress={newPuzzle} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf7eb'
  },
  scrollContent: {
    padding: 20,
    gap: 20
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3d405b',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#5f5f5f',
    lineHeight: 22,
    textAlign: 'center'
  },
  boardSection: {
    gap: 12
  },
  columnHints: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  columnHintCell: {
    alignItems: 'center'
  },
  boardContainer: {
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 0,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12
  },
  rowCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  rowHintCell: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  hintText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3d405b'
  },
  hintSatisfied: {
    color: '#40916c'
  },
  hintExceeded: {
    color: '#c1121f'
  },
  cell: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0efeb'
  },
  cellPressed: {
    transform: [{ scale: 0.96 }]
  },
  cell_empty: {
    backgroundColor: '#f0efeb'
  },
  cell_fruit: {
    backgroundColor: '#f9dcc4'
  },
  cell_mark: {
    backgroundColor: '#e0e0e0'
  },
  cellEmoji: {
    fontSize: 28
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#3d405b',
    lineHeight: 22
  },
  actions: {
    flexDirection: 'column',
    gap: 12
  },
  button: {
    backgroundColor: '#3d405b',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2
  },
  buttonPressed: {
    backgroundColor: '#2f3353'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
