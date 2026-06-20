import { EvaluationError } from '#/formula/evaluator.error'
import { getCellCoordinatesFromId, getNormalizedCellId } from '#/formula/evaluator.helpers'
import type { Cell, CellId, DependencyGraph } from '#/spreadsheet/types'

/** Returns the canonical uppercase ID for a cell inside the configured grid. */
export const getCellId = (cellId: CellId, columnCount: number, rowCount: number): CellId => {
  try {
    const normalizedCellId = getNormalizedCellId(cellId)
    const { x, y } = getCellCoordinatesFromId(normalizedCellId)

    if (x <= columnCount && y <= rowCount) {
      return normalizedCellId
    }
  } catch (error) {
    if (!(error instanceof EvaluationError)) throw error
  }

  throw new Error(`Cell ${getNormalizedCellId(cellId)} is outside the spreadsheet`)
}

/** Applies spreadsheet coercion rules when a formula reads another cell. */
export const getCellNumericValue = (
  cellsById: ReadonlyMap<CellId, Cell>,
  cellId: CellId
): number | undefined => {
  const referencedCell = cellsById.get(cellId)

  // Missing and blank cells behave as zero in formulas. Errors and nonnumeric text do not.
  if (!referencedCell || referencedCell.raw.trim() === '') return 0
  if (referencedCell.error) return undefined
  if (typeof referencedCell.value === 'number') return referencedCell.value

  const numericValue = Number(referencedCell.raw.trim())
  return Number.isFinite(numericValue) ? numericValue : undefined
}

/** Lists every affected cell after any affected cells it depends on. */
export const getAffectedCellIdsInEvaluationOrder = (
  dependencyGraph: DependencyGraph,
  editedCellId: CellId
): CellId[] => {
  const affectedCellIds = new Set<CellId>()
  const pendingDependentCellIds = [...dependencyGraph.getDependentsFor(editedCellId)]

  // First collect direct and transitive dependents of the edited cell.
  while (pendingDependentCellIds.length > 0) {
    const dependentCellId = pendingDependentCellIds.pop()
    if (dependentCellId === undefined || affectedCellIds.has(dependentCellId)) continue

    affectedCellIds.add(dependentCellId)
    pendingDependentCellIds.push(...dependencyGraph.getDependentsFor(dependentCellId))
  }

  const unresolvedDependencyCountByCellId = new Map<CellId, number>()
  const readyCellIds: CellId[] = []

  for (const affectedCellId of affectedCellIds) {
    let unresolvedDependencyCount = 0

    for (const dependencyCellId of dependencyGraph.getDependenciesFor(affectedCellId)) {
      if (affectedCellIds.has(dependencyCellId)) unresolvedDependencyCount += 1
    }

    unresolvedDependencyCountByCellId.set(affectedCellId, unresolvedDependencyCount)
    if (unresolvedDependencyCount === 0) readyCellIds.push(affectedCellId)
  }

  const cellIdsInEvaluationOrder: CellId[] = []

  // A cell becomes ready after every affected dependency has been ordered before it.
  while (readyCellIds.length > 0) {
    const readyCellId = readyCellIds.pop()
    if (readyCellId === undefined) continue

    cellIdsInEvaluationOrder.push(readyCellId)

    for (const dependentCellId of dependencyGraph.getDependentsFor(readyCellId)) {
      if (!affectedCellIds.has(dependentCellId)) continue

      const unresolvedDependencyCount =
        (unresolvedDependencyCountByCellId.get(dependentCellId) ?? 0) - 1
      unresolvedDependencyCountByCellId.set(dependentCellId, unresolvedDependencyCount)
      if (unresolvedDependencyCount === 0) readyCellIds.push(dependentCellId)
    }
  }

  return cellIdsInEvaluationOrder
}
