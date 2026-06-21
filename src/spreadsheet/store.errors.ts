import { EvaluationError } from '#/formula/evaluator.error'
import { ParserError } from '#/formula/parser.error'
import { TokenizerError } from '#/formula/tokenizer.error'
import { CellError } from '#/spreadsheet/cell.error'

export function assertEvaluationError(error: unknown): asserts error is EvaluationError {
  if (!(error instanceof EvaluationError)) throw error
}

export function throwFormulaError(error: unknown): never {
  if (error instanceof ParserError || error instanceof TokenizerError) {
    throw new CellError('formula', 'Formula syntax is invalid')
  }

  throw error
}
