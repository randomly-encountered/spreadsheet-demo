export type CellId = string

export type DependencyGraph = {
  getDependenciesFor: (cellId: CellId) => ReadonlySet<CellId>
  getDependentsFor: (cellId: CellId) => ReadonlySet<CellId>
  setDependenciesFor: (cellId: CellId, dependencies: ReadonlySet<CellId>) => boolean
}
