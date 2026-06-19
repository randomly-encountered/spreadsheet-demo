import type { CellId, DependencyGraph } from '#/spreadsheet/types'

export function createDependencyGraph(): DependencyGraph {
  const dependencies = new Map<CellId, Set<CellId>>()
  const dependents = new Map<CellId, Set<CellId>>()

  function getDependenciesFor(cellId: CellId): ReadonlySet<CellId> {
    return dependencies.get(cellId) ?? new Set()
  }

  function getDependentsFor(cellId: CellId): ReadonlySet<CellId> {
    return dependents.get(cellId) ?? new Set()
  }

  // A cycle exists if the proposed dependencies eventually lead back to this cell.
  function hasCyclicDependenciesFor(
    cellId: CellId,
    proposedDependencies: ReadonlySet<CellId>
  ): boolean {
    const dependenciesToCheck = [...proposedDependencies]
    const dependenciesAddedToCheck = new Set(proposedDependencies)

    while (dependenciesToCheck.length > 0) {
      const currentDependency = dependenciesToCheck.pop()

      if (currentDependency === undefined) continue
      // The formula is cyclic if one of its dependencies leads back to this cell.
      if (currentDependency === cellId) return true

      // Check the cells referenced by this dependency next.
      for (const dependency of dependencies.get(currentDependency) ?? []) {
        if (dependenciesAddedToCheck.has(dependency)) continue

        dependenciesAddedToCheck.add(dependency)
        dependenciesToCheck.push(dependency)
      }
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
    proposedDependencies: ReadonlySet<CellId>
  ): boolean {
    const nextDependencies = new Set(proposedDependencies)

    if (hasCyclicDependenciesFor(cellId, nextDependencies)) return false

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

  return { getDependenciesFor, getDependentsFor, setDependenciesFor }
}
