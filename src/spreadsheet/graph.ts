import type { CellId, DependencyGraph } from '#/spreadsheet/types'

function* walkRelatedCells(
  initialCellIds: Iterable<CellId>,
  getRelatedCellIds: (cellId: CellId) => ReadonlySet<CellId>,
): Generator<CellId> {
  const visitedCellIds = new Set<CellId>()
  const cellIdStack = [...initialCellIds]

  while (cellIdStack.length > 0) {
    const cellId = cellIdStack.pop()
    if (cellId === undefined || visitedCellIds.has(cellId)) continue

    visitedCellIds.add(cellId)
    yield cellId
    cellIdStack.push(...getRelatedCellIds(cellId))
  }
}

export function createDependencyGraph(): DependencyGraph {
  const dependencies = new Map<CellId, Set<CellId>>()
  const dependents = new Map<CellId, Set<CellId>>()
  const dependencyLocusByCellId = new Map<CellId, ReadonlySet<CellId>>()

  function getDependenciesFor(cellId: CellId): ReadonlySet<CellId> {
    return dependencies.get(cellId) ?? new Set()
  }

  function getDependentsFor(cellId: CellId): ReadonlySet<CellId> {
    return dependents.get(cellId) ?? new Set()
  }

  function getDependencyLocusFor(cellId: CellId): ReadonlySet<CellId> {
    const cachedLocus = dependencyLocusByCellId.get(cellId)
    if (cachedLocus) return cachedLocus

    const dependencyLocus = new Set(
      walkRelatedCells(getDependenciesFor(cellId), getDependenciesFor),
    )

    dependencyLocusByCellId.set(cellId, dependencyLocus)
    return dependencyLocus
  }

  function collectTransitiveDependents(cellId: CellId): Set<CellId> {
    return new Set(walkRelatedCells(getDependentsFor(cellId), getDependentsFor))
  }

  function sortInEvaluationOrder(cellIds: ReadonlySet<CellId>): CellId[] {
    const unresolvedDependencyCounts = new Map<CellId, number>()
    const readyCellIds: CellId[] = []

    for (const cellId of cellIds) {
      const unresolvedDependencyCount = [...getDependenciesFor(cellId)].filter(
        dependencyCellId => cellIds.has(dependencyCellId),
      ).length

      unresolvedDependencyCounts.set(cellId, unresolvedDependencyCount)
      if (unresolvedDependencyCount === 0) readyCellIds.push(cellId)
    }

    const orderedCellIds: CellId[] = []

    while (readyCellIds.length > 0) {
      const readyCellId = readyCellIds.pop()
      if (readyCellId === undefined) continue

      orderedCellIds.push(readyCellId)

      for (const dependentCellId of getDependentsFor(readyCellId)) {
        if (!cellIds.has(dependentCellId)) continue

        const unresolvedDependencyCount
          = (unresolvedDependencyCounts.get(dependentCellId) ?? 0) - 1
        unresolvedDependencyCounts.set(dependentCellId, unresolvedDependencyCount)
        if (unresolvedDependencyCount === 0) readyCellIds.push(dependentCellId)
      }
    }

    return orderedCellIds
  }

  function getDependentsInEvaluationOrder(cellId: CellId): CellId[] {
    return sortInEvaluationOrder(collectTransitiveDependents(cellId))
  }

  // A cycle exists if the proposed dependencies eventually lead back to this cell.
  function hasCyclicDependenciesFor(
    cellId: CellId,
    proposedDependencies: ReadonlySet<CellId>,
  ): boolean {
    for (const dependency of walkRelatedCells(proposedDependencies, getDependenciesFor)) {
      if (dependency === cellId) return true
    }

    return false
  }

  // Stop each current dependency from listing this cell as a dependent.
  function removeDependentReferencesFor(cellId: CellId): void {
    for (const dependency of dependencies.get(cellId) ?? []) {
      const dependencyDependents = dependents.get(dependency)
      if (!dependencyDependents) continue

      dependencyDependents.delete(cellId)
      if (dependencyDependents.size === 0) dependents.delete(dependency)
    }
  }

  // Validate and atomically replace a cell's dependency relationships in both indexes.
  function setDependenciesFor(
    cellId: CellId,
    proposedDependencies: ReadonlySet<CellId>,
  ): boolean {
    const nextDependencies = new Set(proposedDependencies)

    if (hasCyclicDependenciesFor(cellId, nextDependencies)) return false

    dependencyLocusByCellId.clear()
    removeDependentReferencesFor(cellId)

    if (nextDependencies.size === 0) {
      dependencies.delete(cellId)
      return true
    }

    dependencies.set(cellId, nextDependencies)

    for (const dependency of nextDependencies) {
      const dependencyDependents = dependents.get(dependency) ?? new Set<CellId>()
      dependencyDependents.add(cellId)
      dependents.set(dependency, dependencyDependents)
    }

    return true
  }

  return {
    getDependenciesFor,
    getDependencyLocusFor,
    getDependentsFor,
    getDependentsInEvaluationOrder,
    setDependenciesFor,
  }
}
