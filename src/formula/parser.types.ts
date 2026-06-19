export class ParserError extends Error {
  readonly position: number

  constructor(message: string, position: number) {
    super(message)
    this.name = 'ParserError'
    this.position = position
  }
}
