import { COLUMN_COUNT, ROW_COUNT } from '#/components/Spreadsheet/constants'

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
