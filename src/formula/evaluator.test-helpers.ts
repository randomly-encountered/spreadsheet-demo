import { expect } from 'vitest'

import type { Expression } from '#/formula/ast.types'
import { evaluate, EvaluationError } from '#/formula/evaluator'
import type { CellValueLookup, EvaluationErrorCode } from '#/formula/evaluator.types'
import { parse } from '#/formula/parser'
import { tokenize } from '#/formula/tokenizer'

export const parseFormula = (source: string): Expression => parse(tokenize(source))

export const createCellValueLookup =
  (values: Readonly<Record<string, number>>): CellValueLookup =>
  (reference) =>
    values[reference]

export const expectFormulaEvaluationError = (
  source: string,
  code: EvaluationErrorCode,
  lookup: CellValueLookup
): void => {
  try {
    evaluate(parseFormula(source), lookup)
    throw new Error('Expected evaluation to fail')
  } catch (error) {
    expect(error).toBeInstanceOf(EvaluationError)
    expect((error as EvaluationError).code).toBe(code)
  }
}
