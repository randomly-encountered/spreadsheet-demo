import { expect } from 'vitest'

import type { Expression } from '#/formula/ast.types'
import { evaluate, EvaluationError } from '#/formula/evaluator'
import type { CellValueLookup, EvaluationErrorType } from '#/formula/evaluator.types'
import { parse } from '#/formula/parser'
import { tokenize } from '#/formula/tokenizer'

export const parseFormula = (source: string): Expression => parse(tokenize(source))

export const createCellValueLookup
  = (values: Readonly<Record<string, number | null>>): CellValueLookup =>
    cellId =>
      values[cellId]

export const expectFormulaEvaluationError = (
  source: string,
  type: EvaluationErrorType,
  lookup: CellValueLookup,
): void => {
  try {
    evaluate(parseFormula(source), lookup)
    throw new Error('Expected evaluation to fail')
  }
  catch (error) {
    expect(error).toBeInstanceOf(EvaluationError)
    expect((error as EvaluationError).type).toBe(type)
  }
}
