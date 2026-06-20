import { describe, expect, it } from 'vitest'

import { parse } from '#/formula/parser'
import {
  cell,
  colon,
  comma,
  identifier,
  leftParen,
  number,
  operator,
  parseTokens,
  rightParen,
  type TokenFixture
} from '#/formula/parser.test-helpers'
import { ParserError } from '#/formula/parser.error'

describe('parse', () => {
  it('parses number and cell token payloads', () => {
    expect(parseTokens(number(3.14))).toEqual({ type: 'numberLiteral', value: 3.14 })
    expect(parseTokens(cell('A1', 'a1'))).toEqual({ reference: 'A1', type: 'cellReference' })
  })

  it('uses parentheses to group expressions', () => {
    expect(
      parseTokens(
        leftParen,
        number(1),
        operator('+'),
        number(2),
        rightParen,
        operator('*'),
        number(3)
      )
    ).toEqual({
      left: {
        left: { type: 'numberLiteral', value: 1 },
        operator: '+',
        right: { type: 'numberLiteral', value: 2 },
        type: 'binaryExpression'
      },
      operator: '*',
      right: { type: 'numberLiteral', value: 3 },
      type: 'binaryExpression'
    })
  })

  it('parses multiplication before addition', () => {
    expect(parseTokens(number(1), operator('+'), number(2), operator('*'), number(3))).toEqual({
      left: { type: 'numberLiteral', value: 1 },
      operator: '+',
      right: {
        left: { type: 'numberLiteral', value: 2 },
        operator: '*',
        right: { type: 'numberLiteral', value: 3 },
        type: 'binaryExpression'
      },
      type: 'binaryExpression'
    })
  })

  it('parses additive and multiplicative operators left-associatively', () => {
    expect(parseTokens(number(10), operator('-'), number(3), operator('+'), number(1))).toEqual({
      left: {
        left: { type: 'numberLiteral', value: 10 },
        operator: '-',
        right: { type: 'numberLiteral', value: 3 },
        type: 'binaryExpression'
      },
      operator: '+',
      right: { type: 'numberLiteral', value: 1 },
      type: 'binaryExpression'
    })

    expect(parseTokens(number(12), operator('/'), number(3), operator('*'), number(2))).toEqual({
      left: {
        left: { type: 'numberLiteral', value: 12 },
        operator: '/',
        right: { type: 'numberLiteral', value: 3 },
        type: 'binaryExpression'
      },
      operator: '*',
      right: { type: 'numberLiteral', value: 2 },
      type: 'binaryExpression'
    })
  })

  it('parses exponentiation right-associatively', () => {
    expect(parseTokens(number(2), operator('^'), number(3), operator('^'), number(2))).toEqual({
      left: { type: 'numberLiteral', value: 2 },
      operator: '^',
      right: {
        left: { type: 'numberLiteral', value: 3 },
        operator: '^',
        right: { type: 'numberLiteral', value: 2 },
        type: 'binaryExpression'
      },
      type: 'binaryExpression'
    })
  })

  it('parses exponentiation before unary operators', () => {
    expect(parseTokens(operator('-'), number(2), operator('^'), number(2))).toEqual({
      operand: {
        left: { type: 'numberLiteral', value: 2 },
        operator: '^',
        right: { type: 'numberLiteral', value: 2 },
        type: 'binaryExpression'
      },
      operator: '-',
      type: 'unaryExpression'
    })

    expect(parseTokens(number(2), operator('^'), operator('-'), number(3))).toEqual({
      left: { type: 'numberLiteral', value: 2 },
      operator: '^',
      right: {
        operand: { type: 'numberLiteral', value: 3 },
        operator: '-',
        type: 'unaryExpression'
      },
      type: 'binaryExpression'
    })
  })

  it('parses nested unary operators', () => {
    expect(parseTokens(operator('+'), operator('-'), cell('A1'))).toEqual({
      operand: {
        operand: { reference: 'A1', type: 'cellReference' },
        operator: '-',
        type: 'unaryExpression'
      },
      operator: '+',
      type: 'unaryExpression'
    })
  })

  it('applies unary operators before multiplication and as additive operands', () => {
    expect(parseTokens(operator('-'), number(2), operator('*'), number(3))).toEqual({
      left: {
        operand: { type: 'numberLiteral', value: 2 },
        operator: '-',
        type: 'unaryExpression'
      },
      operator: '*',
      right: { type: 'numberLiteral', value: 3 },
      type: 'binaryExpression'
    })

    expect(parseTokens(number(1), operator('+'), operator('-'), number(2))).toEqual({
      left: { type: 'numberLiteral', value: 1 },
      operator: '+',
      right: {
        operand: { type: 'numberLiteral', value: 2 },
        operator: '-',
        type: 'unaryExpression'
      },
      type: 'binaryExpression'
    })
  })

  it('parses nested parentheses without adding structural nodes', () => {
    expect(parseTokens(leftParen, leftParen, cell('A1'), rightParen, rightParen)).toEqual({
      reference: 'A1',
      type: 'cellReference'
    })
  })

  it('parses cell ranges', () => {
    expect(parseTokens(cell('A1', 'a1'), colon, cell('B5'))).toEqual({
      end: { reference: 'B5', type: 'cellReference' },
      start: { reference: 'A1', type: 'cellReference' },
      type: 'rangeReference'
    })
  })

  it('parses function token payloads and argument expressions', () => {
    expect(
      parseTokens(
        identifier('SUM', 'sum'),
        leftParen,
        cell('A1'),
        colon,
        cell('A3'),
        comma,
        cell('C1'),
        operator('+'),
        number(2),
        rightParen
      )
    ).toEqual({
      arguments: [
        {
          end: { reference: 'A3', type: 'cellReference' },
          start: { reference: 'A1', type: 'cellReference' },
          type: 'rangeReference'
        },
        {
          left: { reference: 'C1', type: 'cellReference' },
          operator: '+',
          right: { type: 'numberLiteral', value: 2 },
          type: 'binaryExpression'
        }
      ],
      name: 'SUM',
      type: 'functionCall'
    })
  })

  it('parses nested and zero-argument function calls without validating support', () => {
    expect(
      parseTokens(
        identifier('MYSTERY'),
        leftParen,
        identifier('ROUND'),
        leftParen,
        cell('A1'),
        comma,
        number(2),
        rightParen,
        comma,
        identifier('EMPTY'),
        leftParen,
        rightParen,
        rightParen
      )
    ).toEqual({
      arguments: [
        {
          arguments: [
            { reference: 'A1', type: 'cellReference' },
            { type: 'numberLiteral', value: 2 }
          ],
          name: 'ROUND',
          type: 'functionCall'
        },
        { arguments: [], name: 'EMPTY', type: 'functionCall' }
      ],
      name: 'MYSTERY',
      type: 'functionCall'
    })
  })

  it.each<[string, TokenFixture[], number]>([
    ['empty input', [], 0],
    ['adjacent values', [number(1), number(2)], 1],
    ['bare identifier', [identifier('SUM')], 3],
    ['operator after identifier', [identifier('SUM'), operator('+'), number(1)], 3],
    ['unclosed group', [leftParen, number(1), operator('+'), number(2)], 4],
    ['missing right operand', [number(1), operator('+')], 2],
    ['trailing comma', [identifier('SUM'), leftParen, number(1), comma, rightParen], 6],
    ['leading comma', [identifier('SUM'), leftParen, comma, number(1), rightParen], 4],
    ['non-cell range end', [cell('A1'), colon, number(2)], 3],
    ['chained range', [cell('A1'), colon, cell('B2'), colon, cell('C3')], 5],
    ['unmatched right parenthesis', [number(1), rightParen], 1],
    [
      'value after function call',
      [identifier('SUM'), leftParen, number(1), rightParen, number(2)],
      6
    ]
  ])('rejects %s at the expected position', (_name, tokens, position) => {
    expect(() => parseTokens(...tokens)).toThrow(
      expect.objectContaining<Partial<ParserError>>({
        name: 'ParserError',
        position
      })
    )
  })

  it('rejects tokens after the end-of-input marker', () => {
    expect(() =>
      parse([
        { end: 1, lexeme: '1', start: 0, type: 'number', value: 1 },
        { end: 1, lexeme: '', start: 1, type: 'eof' },
        { end: 2, lexeme: '2', start: 1, type: 'number', value: 2 }
      ])
    ).toThrow(expect.objectContaining<Partial<ParserError>>({ position: 1 }))
  })
})
