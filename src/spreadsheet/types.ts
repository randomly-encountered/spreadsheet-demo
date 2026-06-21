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
  setDependenciesFor: (cellId: CellId, dependencies: ReadonlySet<CellId>) => boolean
}

export type SetCellResult = {
  error?: CellError | EvaluationError
  accepted: boolean
}

export type SpreadsheetEngine = {
  getCell: (cellId: CellId) => Cell
  setCell: (cellId: CellId, raw: string) => SetCellResult
}

export type SpreadsheetEngineOptions = {
  columns?: number
  rows?: number
}
