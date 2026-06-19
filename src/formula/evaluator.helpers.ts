import type { RangeReference } from '#/formula/ast.types'
import { EvaluationError } from '#/formula/evaluator.error'
import type { CellValueLookup } from '#/formula/evaluator.types'

type CellCoordinates = {
  column: number
  reference: string
  row: number
}

const CELL_REFERENCE_PATTERN = /^([A-Z]+)([1-9]\d*)$/
const MAX_EXPANDED_RANGE_SIZE = 10_000

const columnNameToNumber = (name: string): number => {
  let column = 0

  for (const character of name) {
    column = column * 26 + character.charCodeAt(0) - 64
  }

  return column
}

const columnNumberToName = (column: number): string => {
  let name = ''

  while (column > 0) {
    const remainder = (column - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    column = Math.floor((column - 1) / 26)
  }

  return name
}

export const parseCellReference = (reference: string): CellCoordinates => {
  const normalizedReference = reference.toUpperCase()
  const match = CELL_REFERENCE_PATTERN.exec(normalizedReference)

  if (!match) {
    throw new EvaluationError('reference', `Invalid cell reference ${reference}`)
  }

  const coordinates = {
    column: columnNameToNumber(match[1]),
    reference: normalizedReference,
    row: Number(match[2])
  }

  if (!Number.isSafeInteger(coordinates.column) || !Number.isSafeInteger(coordinates.row)) {
    throw new EvaluationError('reference', `Cell reference ${reference} is outside safe bounds`)
  }

  return coordinates
}

/** Iterates a top-left to bottom-right rectangular range in row-major order. */
export const iterateRange = function* (range: RangeReference): Generator<string> {
  const start = parseCellReference(range.start.reference)
  const end = parseCellReference(range.end.reference)

  if (start.column > end.column || start.row > end.row) {
    throw new EvaluationError(
      'invalid-range',
      `Range ${range.start.reference}:${range.end.reference} is reversed`
    )
  }

  const width = end.column - start.column + 1
  const height = end.row - start.row + 1

  if (width > MAX_EXPANDED_RANGE_SIZE / height) {
    throw new EvaluationError(
      'invalid-range',
      `Range ${range.start.reference}:${range.end.reference} is too large`
    )
  }

  for (let row = start.row; row <= end.row; row += 1) {
    for (let column = start.column; column <= end.column; column += 1) {
      yield `${columnNumberToName(column)}${row}`
    }
  }
}

export const readCell = (reference: string, lookup: CellValueLookup): number => {
  const parsedReference = parseCellReference(reference)
  const value = lookup(parsedReference.reference)

  if (value === undefined || !Number.isFinite(value)) {
    throw new EvaluationError('reference', `Cell ${parsedReference.reference} has no numeric value`)
  }

  return value
}

export const ensureFinite = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new EvaluationError('calculation', 'Formula produced a non-finite result')
  }

  return value
}
