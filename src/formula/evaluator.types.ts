export type EvaluationErrorType =
  | 'argument-count'
  | 'calculation'
  | 'division-by-zero'
  | 'invalid-range'
  | 'range-not-allowed'
  | 'reference'
  | 'unsupported-function'

export type CellValueLookup = (cellId: string) => number | undefined
