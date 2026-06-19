import type { Expression } from '#/formula/ast.types'
import { ParserError } from '#/formula/parser.types'
import type { Operator, Token } from '#/formula/tokenizer.types'

type UnaryOperator = Extract<Operator, '+' | '-'>

class Parser {
  private position = 0
  private readonly tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  // expression -> additive
  parse(): Expression {
    const expression = this.parseAdditive()
    const token = this.current()

    if (token.type !== 'eof') {
      throw new ParserError(`Unexpected token ${token.lexeme}`, token.start)
    }

    const trailingToken = this.tokens[this.position + 1]
    if (trailingToken) {
      throw new ParserError(`Unexpected token ${trailingToken.lexeme}`, trailingToken.start)
    }

    return expression
  }

  // additive -> multiplicative (('+' | '-') multiplicative)*
  private parseAdditive(): Expression {
    let expression = this.parseMultiplicative()

    while (this.isOperator('+') || this.isOperator('-')) {
      const operator = this.expect('operator', 'Expected additive operator').operator
      expression = {
        left: expression,
        operator,
        right: this.parseMultiplicative(),
        type: 'binaryExpression'
      }
    }

    return expression
  }

  // multiplicative -> unary (('*' | '/') unary)*
  private parseMultiplicative(): Expression {
    let expression = this.parseUnary()

    while (this.isOperator('*') || this.isOperator('/')) {
      const operator = this.expect('operator', 'Expected multiplicative operator').operator
      expression = {
        left: expression,
        operator,
        right: this.parseUnary(),
        type: 'binaryExpression'
      }
    }

    return expression
  }

  // unary -> ('+' | '-') unary | exponentiation
  private parseUnary(): Expression {
    if (this.isOperator('+') || this.isOperator('-')) {
      const operator = this.expect('operator', 'Expected unary operator').operator as UnaryOperator
      return {
        operand: this.parseUnary(),
        operator,
        type: 'unaryExpression'
      }
    }

    return this.parseExponentiation()
  }

  // exponentiation -> primary ('^' unary)?
  private parseExponentiation(): Expression {
    const left = this.parsePrimary()

    if (!this.isOperator('^')) return left

    this.advance()
    return {
      left,
      operator: '^',
      right: this.parseUnary(),
      type: 'binaryExpression'
    }
  }

  private parsePrimary(): Expression {
    const token = this.current()

    switch (token.type) {
      case 'number':
        this.advance()
        return { type: 'numberLiteral', value: token.value }
      case 'cell':
        return this.parseCellOrRange()
      case 'identifier':
        return this.parseFunctionCall()
      case 'leftParen': {
        this.advance()
        const expression = this.parseAdditive()
        this.expect('rightParen', 'Expected closing parenthesis')
        return expression
      }
      default:
        throw new ParserError(`Expected expression, found ${token.lexeme || 'end of input'}`, token.start)
    }
  }

  private parseCellOrRange(): Expression {
    const start = this.expect('cell', 'Expected cell reference')
    const startReference = { reference: start.reference, type: 'cellReference' } as const

    if (this.current().type !== 'colon') return startReference

    this.advance()
    const end = this.expect('cell', 'Expected cell reference after colon')
    return {
      end: { reference: end.reference, type: 'cellReference' },
      start: startReference,
      type: 'rangeReference'
    }
  }

  private parseFunctionCall(): Expression {
    const identifier = this.expect('identifier', 'Expected function name')

    if (this.current().type !== 'leftParen') {
      throw new ParserError('Expected parenthesis after function name', this.current().start)
    }

    this.advance()
    const argumentsList: Expression[] = []

    if (this.current().type !== 'rightParen') {
      argumentsList.push(this.parseAdditive())

      while (this.current().type === 'comma') {
        this.advance()
        argumentsList.push(this.parseAdditive())
      }
    }

    this.expect('rightParen', 'Expected closing parenthesis')
    return { arguments: argumentsList, name: identifier.name, type: 'functionCall' }
  }

  private isOperator(operator: Operator): boolean {
    const token = this.current()
    return token.type === 'operator' && token.operator === operator
  }

  private current(): Token {
    const token = this.tokens[this.position]
    if (token) return token

    const end = this.tokens.at(-1)?.end ?? 0
    throw new ParserError('Unexpected end of token stream', end)
  }

  private advance(): Token {
    const token = this.current()
    this.position += 1
    return token
  }

  private expect<Type extends Token['type']>(
    type: Type,
    message: string
  ): Extract<Token, { type: Type }> {
    const token = this.current()
    if (token.type !== type) throw new ParserError(message, token.start)
    this.position += 1
    return token as Extract<Token, { type: Type }>
  }
}

/** Converts positioned formula tokens into a syntax-only expression tree. */
export function parse(tokens: Token[]): Expression {
  return new Parser(tokens).parse()
}
