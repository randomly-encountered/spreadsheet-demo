import { describe, expect, it } from 'vitest'

import { tokenize } from '#/formula/tokenizer'
import { TokenizerError } from '#/formula/tokenizer.error'

describe('tokenize', () => {
  it('returns only EOF for empty or whitespace-only input', () => {
    expect(tokenize(' \t\n')).toEqual([{ end: 3, lexeme: '', start: 3, type: 'eof' }])
  })

  it('tokenizes numbers and decimals', () => {
    expect(tokenize('42 3.14')).toEqual([
      { end: 2, lexeme: '42', start: 0, type: 'number', value: 42 },
      { end: 7, lexeme: '3.14', start: 3, type: 'number', value: 3.14 },
      { end: 7, lexeme: '', start: 7, type: 'eof' },
    ])
  })

  it('accepts decimals with an omitted leading or trailing zero', () => {
    expect(tokenize('.5 5.')).toEqual([
      { end: 2, lexeme: '.5', start: 0, type: 'number', value: 0.5 },
      { end: 5, lexeme: '5.', start: 3, type: 'number', value: 5 },
      { end: 5, lexeme: '', start: 5, type: 'eof' },
    ])
  })

  it('tokenizes and normalizes cell references', () => {
    expect(tokenize('a1 AA10')).toEqual([
      { end: 2, lexeme: 'a1', reference: 'A1', start: 0, type: 'cell' },
      { end: 7, lexeme: 'AA10', reference: 'AA10', start: 3, type: 'cell' },
      { end: 7, lexeme: '', start: 7, type: 'eof' },
    ])
  })

  it('tokenizes and normalizes function identifiers', () => {
    expect(tokenize('sum ROUND')).toEqual([
      { end: 3, lexeme: 'sum', name: 'SUM', start: 0, type: 'identifier' },
      {
        end: 9,
        lexeme: 'ROUND',
        name: 'ROUND',
        start: 4,
        type: 'identifier',
      },
      { end: 9, lexeme: '', start: 9, type: 'eof' },
    ])
  })

  it('leaves function support validation to the evaluator', () => {
    expect(tokenize('mystery')).toEqual([
      {
        end: 7,
        lexeme: 'mystery',
        name: 'MYSTERY',
        start: 0,
        type: 'identifier',
      },
      { end: 7, lexeme: '', start: 7, type: 'eof' },
    ])
  })

  it('leaves cell-bound validation to a later stage', () => {
    expect(tokenize('A0')).toEqual([
      { end: 2, lexeme: 'A0', reference: 'A0', start: 0, type: 'cell' },
      { end: 2, lexeme: '', start: 2, type: 'eof' },
    ])
  })

  it('tokenizes every supported operator and delimiter', () => {
    expect(
      tokenize('+ - * / ^ ( ) , :').map(token =>
        token.type === 'operator'
          ? { lexeme: token.lexeme, operator: token.operator, type: token.type }
          : { lexeme: token.lexeme, type: token.type },
      ),
    ).toEqual([
      { lexeme: '+', operator: '+', type: 'operator' },
      { lexeme: '-', operator: '-', type: 'operator' },
      { lexeme: '*', operator: '*', type: 'operator' },
      { lexeme: '/', operator: '/', type: 'operator' },
      { lexeme: '^', operator: '^', type: 'operator' },
      { lexeme: '(', type: 'leftParen' },
      { lexeme: ')', type: 'rightParen' },
      { lexeme: ',', type: 'comma' },
      { lexeme: ':', type: 'colon' },
      { lexeme: '', type: 'eof' },
    ])
  })

  it('tokenizes a representative formula expression', () => {
    expect(tokenize('SUM(A1:A5, C1, 10)').map(({ lexeme, type }) => ({ lexeme, type }))).toEqual([
      { lexeme: 'SUM', type: 'identifier' },
      { lexeme: '(', type: 'leftParen' },
      { lexeme: 'A1', type: 'cell' },
      { lexeme: ':', type: 'colon' },
      { lexeme: 'A5', type: 'cell' },
      { lexeme: ',', type: 'comma' },
      { lexeme: 'C1', type: 'cell' },
      { lexeme: ',', type: 'comma' },
      { lexeme: '10', type: 'number' },
      { lexeme: ')', type: 'rightParen' },
      { lexeme: '', type: 'eof' },
    ])
  })

  it('tokenizes nested functions and mixed expression types', () => {
    expect(
      tokenize('ROUND(A1 / B2, 2) ^ -3').map(({ lexeme, type }) => ({
        lexeme,
        type,
      })),
    ).toEqual([
      { lexeme: 'ROUND', type: 'identifier' },
      { lexeme: '(', type: 'leftParen' },
      { lexeme: 'A1', type: 'cell' },
      { lexeme: '/', type: 'operator' },
      { lexeme: 'B2', type: 'cell' },
      { lexeme: ',', type: 'comma' },
      { lexeme: '2', type: 'number' },
      { lexeme: ')', type: 'rightParen' },
      { lexeme: '^', type: 'operator' },
      { lexeme: '-', type: 'operator' },
      { lexeme: '3', type: 'number' },
      { lexeme: '', type: 'eof' },
    ])
  })

  it('ignores all whitespace while preserving source positions', () => {
    expect(tokenize('\tA1\n+\t2')).toEqual([
      { end: 3, lexeme: 'A1', reference: 'A1', start: 1, type: 'cell' },
      {
        end: 5,
        lexeme: '+',
        operator: '+',
        start: 4,
        type: 'operator',
      },
      { end: 7, lexeme: '2', start: 6, type: 'number', value: 2 },
      { end: 7, lexeme: '', start: 7, type: 'eof' },
    ])
  })

  it('reports the position of an invalid character', () => {
    expect(() => tokenize('A1 @ B1')).toThrow(
      expect.objectContaining<Partial<TokenizerError>>({
        name: 'TokenizerError',
        position: 3,
      }),
    )
  })

  it('rejects malformed numbers', () => {
    expect(() => tokenize('1.2.3')).toThrow(TokenizerError)
  })

  it.each([
    ['.', 0],
    ['1..2', 2],
    ['A1B2', 2],
    ['12A1', 2],
  ])('rejects malformed lexical boundaries in %s', (expression, position) => {
    expect(() => tokenize(expression)).toThrow(
      expect.objectContaining<Partial<TokenizerError>>({
        name: 'TokenizerError',
        position,
      }),
    )
  })

  it.each([
    ['=A1', 0],
    ['$A$1', 0],
  ])('rejects characters outside the tokenizer grammar in %s', (expression, position) => {
    expect(() => tokenize(expression)).toThrow(
      expect.objectContaining<Partial<TokenizerError>>({
        name: 'TokenizerError',
        position,
      }),
    )
  })
})
