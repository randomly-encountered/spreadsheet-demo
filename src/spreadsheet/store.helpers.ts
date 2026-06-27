import { EvaluationError } from '#/formula/evaluator.error'
import { getCellCoordinatesFromId, getNormalizedCellId } from '#/formula/evaluator.helpers'
import { CellError } from '#/spreadsheet/cell.error'
import type { Cell, CellId } from '#/spreadsheet/types'

/** Returns the canonical ID for a valid cell inside the configured grid. */
export function getCellId(cellId: CellId, columnCount: number, rowCount: number): CellId {
  const normalizedCellId = getNormalizedCellId(cellId)
  let coordinates: ReturnType<typeof getCellCoordinatesFromId>

  try {
    coordinates = getCellCoordinatesFromId(normalizedCellId)
  }
  catch (error) {
    if (error instanceof EvaluationError) {
      throw new CellError('reference', error.message)
    }

    throw error
  }

  if (coordinates.x > columnCount || coordinates.y > rowCount) {
    throw new CellError('reference', `Cell ${normalizedCellId} is outside the spreadsheet`)
  }

  return normalizedCellId
}

/** Applies spreadsheet coercion rules when a formula reads another cell. */
export function getCellNumericValue(
  cellsById: ReadonlyMap<CellId, Cell>,
  cellId: CellId,
): number | undefined {
  const referencedCell = cellsById.get(cellId)

  if (!referencedCell) return 0

  const rawValue = referencedCell.raw.trim()
  if (rawValue === '') return 0
  if (referencedCell.error) return undefined
  if (typeof referencedCell.value === 'number') return referencedCell.value

  const numericValue = Number(rawValue)
  return Number.isFinite(numericValue) ? numericValue : undefined
}
