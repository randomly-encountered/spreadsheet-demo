export type Operator = '+' | '-' | '*' | '/' | '^'

type PositionedToken = {
  end: number
  lexeme: string
  start: number
}

export type Token =
  | (PositionedToken & {
      type: 'number'
      value: number
    })
  | (PositionedToken & {
      reference: string
      type: 'cell'
    })
  | (PositionedToken & {
      name: string
      type: 'identifier'
    })
  | (PositionedToken & {
      lexeme: Operator
      operator: Operator
      type: 'operator'
    })
  | (PositionedToken & {
      type: 'leftParen' | 'rightParen' | 'comma' | 'colon'
    })
  | (PositionedToken & {
      lexeme: ''
      type: 'eof'
    })

export class TokenizerError extends Error {
  readonly position: number

  constructor(message: string, position: number) {
    super(message)
    this.name = 'TokenizerError'
    this.position = position
  }
}
