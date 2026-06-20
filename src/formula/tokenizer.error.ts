export class TokenizerError extends Error {
  readonly position: number

  constructor(message: string, position: number) {
    super(message)
    this.name = 'TokenizerError'
    this.position = position
  }
}
