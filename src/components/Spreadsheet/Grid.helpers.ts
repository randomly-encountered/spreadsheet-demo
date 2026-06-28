import { COLUMN_COUNT, ROW_COUNT } from '#/components/Spreadsheet/constants'

/**
 * Resolves a keyboard navigation command to a cell's row-major index.
 *
 * Arrow keys move one cell in their corresponding direction. `Home` selects
 * the first cell in the current row, while `End` selects the last cell. Moves
 * are clamped to the grid, so attempting to cross an edge returns the current
 * index instead.
 *
 * The caller can pass `KeyboardEvent.key` directly. Unsupported keys return
 * `null`, allowing the caller to ignore the event without preventing its
 * default browser behavior.
 *
 * @param index - The valid row-major index of the currently selected cell.
 * @param key - The keyboard key to interpret as a grid navigation command.
 * @returns The destination cell index, the current index at a grid boundary,
 * or `null` when the key is not a supported navigation command.
 *
 * @example
 * ```ts
 * getNextCellIndex(11, 'ArrowRight') // 12
 * getNextCellIndex(11, 'Home') // 10
 * getNextCellIndex(11, 'Enter') // null
 * ```
 */
export function getNextCellIndex(index: number, key: string): null | number {
  const column = index % COLUMN_COUNT
  const row = Math.floor(index / COLUMN_COUNT)

  switch (key) {
    case 'ArrowLeft':
      return row * COLUMN_COUNT + Math.max(0, column - 1)
    case 'ArrowRight':
      return row * COLUMN_COUNT + Math.min(COLUMN_COUNT - 1, column + 1)
    case 'ArrowUp':
      return Math.max(0, row - 1) * COLUMN_COUNT + column
    case 'ArrowDown':
      return Math.min(ROW_COUNT - 1, row + 1) * COLUMN_COUNT + column
    case 'Home':
      return row * COLUMN_COUNT
    case 'End':
      return row * COLUMN_COUNT + COLUMN_COUNT - 1
    default:
      return null
  }
}
