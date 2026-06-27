import type { Expression } from '#/formula/ast.types'
import { parse } from '#/formula/parser'
import type { Operator, Token } from '#/formula/tokenizer.types'

type WithoutPosition<TokenType> = TokenType extends Token ? Omit<TokenType, 'end' | 'start'> : never

export type TokenFixture = WithoutPosition<Token>

export const number = (value: number, lexeme = String(value)): TokenFixture => ({
  lexeme,
  type: 'number',
  value,
})

export const cell = (reference: string, lexeme = reference): TokenFixture => ({
  lexeme,
  reference,
  type: 'cell',
})

export const identifier = (name: string, lexeme = name): TokenFixture => ({
  lexeme,
  name,
  type: 'identifier',
})

export const operator = (value: Operator): TokenFixture => ({
  lexeme: value,
  operator: value,
  type: 'operator',
})

const symbol = (
  lexeme: '(' | ')' | ',' | ':',
  type: 'colon' | 'comma' | 'leftParen' | 'rightParen',
): TokenFixture => ({ lexeme, type })

export const leftParen = symbol('(', 'leftParen')
export const rightParen = symbol(')', 'rightParen')
export const comma = symbol(',', 'comma')
export const colon = symbol(':', 'colon')

/**
 * Builds positioned token fixtures directly so parser tests exercise only the
 * parser contract. Using tokenize here would couple parser failures to tokenizer
 * behavior, which is covered independently in tokenizer.test.ts.
 */
export const parseTokens = (...fixtures: TokenFixture[]): Expression => {
  let position = 0

  const tokens = fixtures.map((fixture) => {
    const start = position
    position += fixture.lexeme.length
    return { ...fixture, end: position, start } as Token
  })

  tokens.push({ end: position, lexeme: '', start: position, type: 'eof' })

  return parse(tokens)
}
