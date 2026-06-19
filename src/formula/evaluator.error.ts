import type { EvaluationErrorCode } from '#/formula/evaluator.types'

export class EvaluationError extends Error {
  readonly code: EvaluationErrorCode

  constructor(code: EvaluationErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'EvaluationError'
  }
}
