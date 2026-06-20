export type CellErrorType = 'calculation' | 'cycle' | 'formula' | 'reference'

export class CellError extends Error {
  readonly type: CellErrorType

  constructor(type: CellErrorType, message: string) {
    super(message)
    this.type = type
    this.name = 'CellError'
  }
}
