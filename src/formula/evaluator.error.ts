import type { EvaluationErrorType } from '#/formula/evaluator.types'

export class EvaluationError extends Error {
  readonly type: EvaluationErrorType

  constructor(type: EvaluationErrorType, message: string) {
    super(message)
    this.type = type
    this.name = 'EvaluationError'
  }
}
