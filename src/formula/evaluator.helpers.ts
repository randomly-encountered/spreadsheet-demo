import type { RangeReference } from '#/formula/ast.types'
import { EvaluationError } from '#/formula/evaluator.error'
import type { CellValueLookup } from '#/formula/evaluator.types'

type CellCoordinates = {
  x: number
  y: number
}

const CELL_ID_PATTERN = /^(?<columnName>[A-Z]+)(?<rowNumber>[1-9]\d*)$/
const MAX_EXPANDED_RANGE_SIZE = 10_000
const COLUMN_BASE = 26
const COLUMN_CHAR_CODE_OFFSET = 64

const columnNameToNumber = (name: string): number => {
  let column = 0

  for (const character of name) {
    column = column * COLUMN_BASE + character.charCodeAt(0) - COLUMN_CHAR_CODE_OFFSET
  }

  return column
}

const columnNumberToName = (column: number): string => {
  let name = ''

  while (column > 0) {
    const remainder = (column - 1) % COLUMN_BASE
    name = String.fromCharCode(COLUMN_CHAR_CODE_OFFSET + 1 + remainder) + name
    column = Math.floor((column - 1) / COLUMN_BASE)
  }

  return name
}

/** Returns the canonical uppercase form of a cell ID. */
export function getNormalizedCellId(cellId: string): string {
  return cellId.toUpperCase()
}

/** Converts a normalized cell ID such as `A1` or `AA10` to one-based coordinates. */
export function getCellCoordinatesFromId(cellId: string): CellCoordinates {
  const match = CELL_ID_PATTERN.exec(cellId)
  const columnName = match?.groups?.columnName
  const rowNumberText = match?.groups?.rowNumber

  if (!columnName || !rowNumberText) {
    throw new EvaluationError('reference', `Invalid cell reference ${cellId}`)
  }

  return {
    x: columnNameToNumber(columnName),
    y: Number(rowNumberText),
  }
}

export function isFiniteResult(value: number): number {
  if (!Number.isFinite(value)) {
    throw new EvaluationError('calculation', 'Formula produced a non-finite result')
  }

  return value
}

/** Iterates a top-left to bottom-right rectangular range in row-major order. */
export function* iterateRange({ end, start }: RangeReference): Generator<string> {
  const startCell = getCellCoordinatesFromId(getNormalizedCellId(start.reference))
  const endCell = getCellCoordinatesFromId(getNormalizedCellId(end.reference))

  // Range order matters; Guard against reverse arrangements
  if (startCell.x > endCell.x || startCell.y > endCell.y) {
    throw new EvaluationError(
      'invalid-range',
      `Range ${start.reference}:${end.reference} is reversed`,
    )
  }

  const width = endCell.x - startCell.x + 1
  const height = endCell.y - startCell.y + 1

  // Prevent absurd ranges in the abstract use-case for larger grid sizes
  if (width > MAX_EXPANDED_RANGE_SIZE / height) {
    throw new EvaluationError(
      'invalid-range',
      `Range ${start.reference}:${end.reference} is too large`,
    )
  }

  for (let row = startCell.y; row <= endCell.y; row += 1) {
    for (let column = startCell.x; column <= endCell.x; column += 1) {
      yield `${columnNumberToName(column)}${row}`
    }
  }
}

export function readReferencedCellValue(reference: string, lookup: CellValueLookup): number {
  const cellId = getNormalizedCellId(reference)
  const value = lookup(cellId)

  if (value === undefined || !Number.isFinite(value)) {
    throw new EvaluationError('reference', `Cell ${cellId} has no numeric value`)
  }

  return value
}
