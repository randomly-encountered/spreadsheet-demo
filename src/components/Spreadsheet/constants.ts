export const COLUMN_COUNT = 10
export const ROW_COUNT = 10
export const COLUMN_LABELS = Array.from({ length: COLUMN_COUNT }, (_, index) =>
  String.fromCharCode(65 + index)
)

export function getCellId(index: number): string {
  const column = index % COLUMN_COUNT
  const row = Math.floor(index / COLUMN_COUNT) + 1
  return `${COLUMN_LABELS[column]}${row}`
}
