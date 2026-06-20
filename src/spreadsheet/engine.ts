import type { Expression } from '#/formula/ast.types'
import { collectReferencedCellIds, evaluate, EvaluationError } from '#/formula/evaluator'
import { parse } from '#/formula/parser'
import { tokenize } from '#/formula/tokenizer'
import {
  getAffectedCellIdsInEvaluationOrder,
  getCellNumericValue,
  getCellId
} from '#/spreadsheet/engine.helpers'
import { CellError } from '#/spreadsheet/cell.error'
import { createDependencyGraph } from '#/spreadsheet/graph'
import type {
  Cell,
  CellId,
  SetCellResult,
  SpreadsheetEngine,
  SpreadsheetEngineOptions
} from '#/spreadsheet/types'

const DEFAULT_COLUMN_COUNT = 10
const DEFAULT_ROW_COUNT = 10
const EMPTY_CELL: Cell = { raw: '', value: null }
const FORMULA_PREFIX = '='

function parseFormulaInput(rawInput: string): Expression {
  return parse(tokenize(rawInput.slice(FORMULA_PREFIX.length)))
}

/**
 * Creates the spreadsheet engine and keeps enough state to replay dependent
 * formulas after each edit.
 */
export function createSpreadsheetEngine({
  columns = DEFAULT_COLUMN_COUNT,
  rows = DEFAULT_ROW_COUNT
}: SpreadsheetEngineOptions = {}): SpreadsheetEngine {
  const cellMap = new Map<CellId, Cell>()
  const cellFormulaMap = new Map<CellId, Expression>()
  const dependencyGraph = createDependencyGraph()

  /**
   * Adapts cell lookups for formula evaluation by returning undefined for
   * invalid or out-of-bounds references.
   */
  function lookupNumericCellValue(reference: string): number | undefined {
    try {
      const referencedCellId = getCellId(reference, columns, rows)
      return getCellNumericValue(cellMap, referencedCellId)
    } catch {
      return undefined
    }
  }

  /** Walks the dependency graph after an edit and recomputes every downstream formula in order. */
  function reevaluateDependentFormulas(editedCellId: CellId): void {
    const affectedCellIds = getAffectedCellIdsInEvaluationOrder(dependencyGraph, editedCellId)

    for (const affectedCellId of affectedCellIds) {
      const parsedFormula = cellFormulaMap.get(affectedCellId)
      const storedCell = cellMap.get(affectedCellId)

      if (!parsedFormula || !storedCell) continue

      try {
        cellMap.set(affectedCellId, {
          raw: storedCell.raw,
          value: evaluate(parsedFormula, lookupNumericCellValue)
        })
      } catch (evaluationError) {
        cellMap.set(affectedCellId, {
          error:
            evaluationError instanceof EvaluationError
              ? evaluationError
              : new CellError('calculation', 'Formula calculation failed'),
          raw: storedCell.raw,
          value: null
        })
      }
    }
  }

  /**
   * Returns the stored snapshot for a canonical cell ID, or the empty cell
   * when nothing has been written.
   */
  function getCell(cellId: CellId): Cell {
    const canonicalCellId = getCellId(cellId, columns, rows)
    return cellMap.get(canonicalCellId) ?? EMPTY_CELL
  }

  function setLiteralCell(cellId: CellId, rawInput: string): SetCellResult {
    dependencyGraph.setDependenciesFor(cellId, new Set())
    cellFormulaMap.delete(cellId)
    cellMap.set(cellId, {
      raw: rawInput,
      value: rawInput === '' ? null : rawInput
    })
    reevaluateDependentFormulas(cellId)

    return { accepted: true }
  }

  function setFormulaCell(cellId: CellId, rawInput: string): SetCellResult {
    let expression: Expression
    let value: number

    try {
      expression = parseFormulaInput(rawInput)
      value = evaluate(expression, lookupNumericCellValue)
    } catch (formulaError) {
      return {
        accepted: false,
        error:
          formulaError instanceof EvaluationError
            ? formulaError
            : new CellError('formula', 'Formula syntax is invalid')
      }
    }

    const dependencies = collectReferencedCellIds(expression)

    // Dependency replacement is atomic, so rejection preserves the previous formula state.
    if (!dependencyGraph.setDependenciesFor(cellId, dependencies)) {
      return {
        accepted: false,
        error: new CellError('cycle', 'Formula creates a circular dependency')
      }
    }

    cellFormulaMap.set(cellId, expression)
    cellMap.set(cellId, { raw: rawInput, value })
    reevaluateDependentFormulas(cellId)

    return { accepted: true }
  }

  function setCell(cellId: CellId, rawInput: string): SetCellResult {
    const canonicalCellId = getCellId(cellId, columns, rows)

    return rawInput.startsWith(FORMULA_PREFIX)
      ? setFormulaCell(canonicalCellId, rawInput)
      : setLiteralCell(canonicalCellId, rawInput)
  }

  return { getCell, setCell }
}
