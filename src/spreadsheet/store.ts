import type { Expression } from '#/formula/ast.types'
import { collectReferencedCellIds, evaluate } from '#/formula/evaluator'
import { parse } from '#/formula/parser'
import { tokenize } from '#/formula/tokenizer'
import { FORMULA_PREFIX, isFormula } from '#/spreadsheet/cell.helpers'
import { CellError } from '#/spreadsheet/cell.error'
import { createDependencyGraph } from '#/spreadsheet/graph'
import { assertEvaluationError, throwFormulaError } from '#/spreadsheet/store.errors'
import { getCellId, getCellNumericValue } from '#/spreadsheet/store.helpers'
import type { Cell, CellId } from '#/spreadsheet/types'
import { createStore } from 'zustand/vanilla'

const DEFAULT_COLUMN_COUNT = 10
const DEFAULT_ROW_COUNT = 10
const EMPTY_CELL: Readonly<Cell> = Object.freeze({ raw: '', value: null })

export type SpreadsheetStoreOptions = {
  columns?: number
  initialValues?: ReadonlyArray<readonly [CellId, string]>
  rows?: number
}

export type SpreadsheetState = {
  getCell: (cellId: CellId) => Readonly<Cell>
  getDependencyLocusFor: (cellId: CellId) => ReadonlySet<CellId>
  selectCell: (cellId: CellId) => void
  setCell: (cellId: CellId, raw: string) => string
  cells: ReadonlyMap<CellId, Cell>
  selectedCellId: CellId | null
}

export function createSpreadsheetStore({
  columns = DEFAULT_COLUMN_COUNT,
  initialValues = [],
  rows = DEFAULT_ROW_COUNT,
}: SpreadsheetStoreOptions = {}) {
  const dependencyGraph = createDependencyGraph()
  const formulaMap = new Map<CellId, Expression>()
  const store = createStore<SpreadsheetState>()((set, get) => {
    function lookupNumericCellValue(
      cellMap: ReadonlyMap<CellId, Cell>,
      reference: string,
    ): number | null | undefined {
      try {
        return getCellNumericValue(cellMap, getCellId(reference, columns, rows))
      }
      catch {
        return undefined
      }
    }

    function reevaluateDependentFormulas(cellMap: Map<CellId, Cell>, editedCellId: CellId): void {
      for (const affectedCellId of dependencyGraph.getDependentsInEvaluationOrder(editedCellId)) {
        const formula = formulaMap.get(affectedCellId)
        const cell = cellMap.get(affectedCellId)

        if (!formula || !cell) continue
        const { raw } = cell

        try {
          cellMap.set(affectedCellId, {
            raw,
            value: evaluate(formula, reference =>
              lookupNumericCellValue(cellMap, reference),
            ),
          })
        }
        catch (evaluationError) {
          assertEvaluationError(evaluationError)
          cellMap.set(affectedCellId, {
            error: evaluationError,
            raw,
            value: null,
          })
        }
      }
    }

    function applyCellUpdate(cellId: CellId, cell: Cell, expression?: Expression): void {
      if (expression) formulaMap.set(cellId, expression)
      else formulaMap.delete(cellId)

      /*
       * Intentionally clone here such that the map reference is re-set.
       * React subscribers will not be able to react to the change otherwise.
       */
      const cells = new Map(get().cells)
      cells.set(cellId, cell)
      reevaluateDependentFormulas(cells, cellId)
      set({ cells })
    }

    function applyLiteralInput(cellId: CellId, rawInput: string): string {
      const numericValue = Number(rawInput)
      const normalizedInput = rawInput.trim() && Number.isFinite(numericValue)
        ? String(numericValue)
        : rawInput

      dependencyGraph.setDependenciesFor(cellId, new Set())
      applyCellUpdate(cellId, {
        raw: normalizedInput,
        value: normalizedInput || null,
      })

      return normalizedInput
    }

    function applyFormulaInput(cellId: CellId, rawInput: string): void {
      let expression: Expression
      let value: number | null

      try {
        // Extract the raw formula string without the canonical prefix
        expression = parse(tokenize(rawInput.slice(FORMULA_PREFIX.length)))
        value = evaluate(expression, reference =>
          lookupNumericCellValue(get().cells, reference),
        )
      }
      catch (formulaError) {
        throwFormulaError(formulaError)
      }

      const dependencies = collectReferencedCellIds(expression)
      if (!dependencyGraph.setDependenciesFor(cellId, dependencies)) {
        throw new CellError('cycle', 'Formula creates a circular dependency')
      }

      applyCellUpdate(cellId, { raw: rawInput, value }, expression)
    }

    function setCell(cellId: CellId, rawInput: string): string {
      const canonicalCellId = getCellId(cellId, columns, rows)

      if (isFormula(rawInput)) {
        applyFormulaInput(canonicalCellId, rawInput)
        return rawInput
      }

      return applyLiteralInput(canonicalCellId, rawInput)
    }

    return {
      getCell: cellId => get().cells.get(getCellId(cellId, columns, rows)) ?? EMPTY_CELL,
      getDependencyLocusFor: cellId =>
        dependencyGraph.getDependencyLocusFor(getCellId(cellId, columns, rows)),
      selectCell: cellId => set({ selectedCellId: getCellId(cellId, columns, rows) }),
      cells: new Map(),
      selectedCellId: null,
      setCell,
    }
  })

  // Hydrate state from initial values
  for (const [cellId, raw] of initialValues) store.getState().setCell(cellId, raw)

  return store
}

export type SpreadsheetStore = ReturnType<typeof createSpreadsheetStore>
