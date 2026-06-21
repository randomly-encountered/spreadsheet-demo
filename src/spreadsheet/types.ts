import type { EvaluationError } from '#/formula/evaluator.error'
import type { CellError } from '#/spreadsheet/cell.error'

export type CellId = string
export type CellValue = number | string | null

export type Cell = {
  error?: CellError | EvaluationError
  raw: string
  value: CellValue
}

export type DependencyGraph = {
  getDependenciesFor: (cellId: CellId) => ReadonlySet<CellId>
  getDependentsFor: (cellId: CellId) => ReadonlySet<CellId>
  getDependentsInEvaluationOrder: (cellId: CellId) => CellId[]
  setDependenciesFor: (cellId: CellId, dependencies: ReadonlySet<CellId>) => boolean
}
