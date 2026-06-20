import { describe, expect, it } from 'vitest'

import { collectReferencedCellIds, evaluate, EvaluationError } from '#/formula/evaluator'
import {
  createCellValueLookup,
  expectFormulaEvaluationError,
  parseFormula
} from '#/formula/evaluator.test-helpers'

const lookup = createCellValueLookup({ A1: 2, A2: 3, B1: 5, B2: 7 })

describe('evaluate', () => {
  it.each([
    ['+2', 2],
    ['2 + 3 * 4', 14],
    ['8 - 3', 5],
    ['8 / 2', 4],
    ['(2 + 3) * 4', 20],
    ['2 ^ 3 ^ 2', 512],
    ['-2 ^ 2', -4],
    ['--2', 2]
  ])('evaluates %s', (source, expected) => {
    expect(evaluate(parseFormula(source), lookup)).toBe(expected)
  })

  it('resolves normalized cell references', () => {
    expect(evaluate(parseFormula('a1 + B2'), lookup)).toBe(9)
  })

  it('evaluates supported scalar functions and nested expressions', () => {
    expect(evaluate(parseFormula('POWER(A1 + 1, 2)'), lookup)).toBe(9)
  })

  it('flattens rectangular ranges in aggregate functions', () => {
    expect(evaluate(parseFormula('SUM(A1:B2)'), lookup)).toBe(17)
  })

  it('allows aggregate functions to mix ranges and scalar arguments', () => {
    expect(evaluate(parseFormula('AVERAGE(A1:A2, B1)'), lookup)).toBeCloseTo(10 / 3)
  })

  it('expands ranges across multi-letter column boundaries', () => {
    const boundaryLookup = createCellValueLookup({ AA1: 2, AA2: 4, Z1: 1, Z2: 3 })
    expect(evaluate(parseFormula('SUM(Z1:AA2)'), boundaryLookup)).toBe(10)
  })

  it.each([
    ['MISSING(A1)', 'unsupported-function'],
    ['ABS()', 'argument-count'],
    ['ABS(1, 2)', 'argument-count'],
    ['ABS(A1:A2)', 'range-not-allowed'],
    ['A1:A2 + 1', 'range-not-allowed'],
    ['A0 + 1', 'reference'],
    ['C1 + 1', 'reference'],
    ['1 / 0', 'division-by-zero'],
    ['SQRT(-1)', 'calculation'],
    ['10 ^ 1000', 'calculation'],
    ['MOD(1, 0)', 'calculation'],
    ['SUM(A1:A10001)', 'invalid-range']
  ] as const)('reports %s as %s', (source, code) => {
    expectFormulaEvaluationError(source, code, lookup)
  })

  it.each([Number.NaN, Infinity, -Infinity])('rejects non-finite cell value %s', (value) => {
    expectFormulaEvaluationError('A1', 'reference', createCellValueLookup({ A1: value }))
  })

  it('rejects reversed ranges when a function expands them', () => {
    expectFormulaEvaluationError('SUM(A2:A1)', 'invalid-range', lookup)
  })
})

describe('collectReferencedCellIds', () => {
  it('collects normalized unique references throughout an expression', () => {
    expect([...collectReferencedCellIds(parseFormula('A1 + SUM(a1:B2)'))]).toEqual([
      'A1',
      'B1',
      'A2',
      'B2'
    ])
  })

  it('collects references without requiring a supported function', () => {
    expect([...collectReferencedCellIds(parseFormula('UNKNOWN(A1)'))]).toEqual(['A1'])
  })

  it('rejects reversed ranges', () => {
    expect(() => collectReferencedCellIds(parseFormula('SUM(B2:A1)'))).toThrowError(
      EvaluationError
    )
  })

  it('rejects ranges large enough to exhaust the UI thread', () => {
    expect(() => collectReferencedCellIds(parseFormula('SUM(A1:A10001)'))).toThrowError(
      EvaluationError
    )
  })
})
