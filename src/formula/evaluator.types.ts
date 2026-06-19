export type EvaluationErrorCode =
  | 'argument-count'
  | 'calculation'
  | 'division-by-zero'
  | 'invalid-range'
  | 'range-not-allowed'
  | 'reference'
  | 'unsupported-function'

export type CellValueLookup = (reference: string) => number | undefined
