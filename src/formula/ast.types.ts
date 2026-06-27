import type { Operator } from '#/formula/tokenizer.types'

/** Formula examples: `42`, `.5`, `3.14`. */
export type NumberLiteral = {
  type: 'numberLiteral'
  value: number
}

/** Formula examples: `A1`, `a1`, `AA10`. */
export type CellReference = {
  reference: string
  type: 'cellReference'
}

/** Formula examples: `-A1`, `+5`, `--2`. */
export type UnaryExpression = {
  operand: Expression
  operator: Extract<Operator, '+' | '-'>
  type: 'unaryExpression'
}

/** Formula examples: `A1 + B2`, `2 ^ 3`, `10 / 5`. */
export type BinaryExpression = {
  left: Expression
  operator: Operator
  right: Expression
  type: 'binaryExpression'
}

/** Formula examples: `A1:A5`, `a1:B10`. */
export type RangeReference = {
  end: CellReference
  start: CellReference
  type: 'rangeReference'
}

/** Formula examples: `SUM(A1:A5)`, `ROUND(A1, 2)`, `EMPTY()`. */
export type FunctionCall = {
  arguments: Expression[]
  name: string
  type: 'functionCall'
}

export type Expression
  = | NumberLiteral
    | CellReference
    | UnaryExpression
    | BinaryExpression
    | RangeReference
    | FunctionCall

export type ExpressionType = Expression['type']
