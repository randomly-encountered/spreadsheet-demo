import { describe, expect, it } from 'vitest'

import { getFormulaFunction } from '#/formula/functions'
import {
  evaluateFunction,
  evaluateFunctionValues,
  requireFormulaFunction,
  toMixedCase,
} from '#/formula/functions.test-helpers'
import { FORMULA_FUNCTION_NAMES } from '#/formula/functions.types'

describe('function registry', () => {
  it('looks up names case-insensitively without accepting altered names', () => {
    FORMULA_FUNCTION_NAMES.forEach((name) => {
      expect(getFormulaFunction(name.toLowerCase())).toBe(requireFormulaFunction(name))
      expect(getFormulaFunction(toMixedCase(name))).toBe(requireFormulaFunction(name))
    })

    expect(getFormulaFunction('DefinitelyNotSupported')).toBeUndefined()
    expect(getFormulaFunction('')).toBeUndefined()
    expect(getFormulaFunction(' SUM ')).toBeUndefined()
    expect(getFormulaFunction('ſUM')).toBeUndefined()
    expect(getFormulaFunction('constructor')).toBeUndefined()
    expect(getFormulaFunction('toString')).toBeUndefined()
  })

  it.each([
    ['SUM', 1, null, true],
    ['AVERAGE', 1, null, true],
    ['MIN', 1, null, true],
    ['MAX', 1, null, true],
    ['COUNT', 1, null, true],
    ['PRODUCT', 1, null, true],
    ['ABS', 1, 1, false],
    ['ROUND', 1, 2, false],
    ['FLOOR', 1, 1, false],
    ['CEILING', 1, 1, false],
    ['SQRT', 1, 1, false],
    ['POWER', 2, 2, false],
    ['MOD', 2, 2, false],
  ] as const)(
    'describes the invocation contract for %s',
    (name, minimumArguments, maximumArguments, acceptsRanges) => {
      expect(requireFormulaFunction(name)).toMatchObject({
        acceptsRanges,
        maximumArguments,
        minimumArguments,
      })
    },
  )
})

describe('aggregate functions', () => {
  it.each([
    ['SUM', [2, -3, 4.5], 3.5],
    ['AVERAGE', [2, -3, 4], 1],
    ['MIN', [2, -3, 4], -3],
    ['MAX', [2, -3, 4], 4],
    ['COUNT', [2, -3, 4], 3],
    ['PRODUCT', [2, -3, 4], -24],
  ] as const)('%s evaluates mixed-sign values', (name, values, expected) => {
    expect(evaluateFunction(name, ...values)).toBe(expected)
  })

  it('preserves zero in sum and product calculations', () => {
    expect(evaluateFunction('SUM', 0, -0, 5)).toBe(5)
    expect(Math.abs(evaluateFunction('PRODUCT', -4, 0, 8))).toBe(0)
  })

  it('does not round aggregate results', () => {
    expect(evaluateFunction('SUM', 0.25, 0.5)).toBe(0.75)
    expect(evaluateFunction('AVERAGE', 1, 2)).toBe(1.5)
  })

  it('does not use zero as a minimum or maximum sentinel', () => {
    expect(evaluateFunction('MIN', 2, 3)).toBe(2)
    expect(evaluateFunction('MAX', -3, -2)).toBe(-2)
  })

  it('evaluates large ranges without spreading them onto the call stack', () => {
    const values = Array.from({ length: 200_000 }, (_, index) => index - 100_000)

    expect(evaluateFunctionValues('MIN', values)).toBe(-100_000)
    expect(evaluateFunctionValues('MAX', values)).toBe(99_999)
  })

  it.each([
    ['SUM', 7],
    ['AVERAGE', 7],
    ['MIN', 7],
    ['MAX', 7],
    ['COUNT', 1],
    ['PRODUCT', 7],
  ] as const)('%s handles a singleton input', (name, expected) => {
    expect(evaluateFunction(name, 7)).toBe(expected)
  })

  it('counts zero and negative values as numeric values', () => {
    expect(evaluateFunction('COUNT', 0, -0, -4, 2.5)).toBe(4)
  })

  it('defines empty resolved-value behavior without deciding cell coercion', () => {
    expect(evaluateFunction('SUM')).toBe(0)
    expect(evaluateFunction('COUNT')).toBe(0)
    expect(evaluateFunction('PRODUCT')).toBe(1)
    expect(evaluateFunction('AVERAGE')).toBeNaN()
    expect(evaluateFunction('MIN')).toBe(Number.POSITIVE_INFINITY)
    expect(evaluateFunction('MAX')).toBe(Number.NEGATIVE_INFINITY)
  })
})

describe('scalar functions', () => {
  it.each([
    ['ABS', [-4], 4],
    ['ABS', [0], 0],
    ['ABS', [-0], 0],
    ['ROUND', [2.5], 3],
    ['ROUND', [-2.5], -3],
    ['ROUND', [2.6], 3],
    ['ROUND', [-2.6], -3],
    ['ROUND', [1.25, 1], 1.3],
    ['ROUND', [-1.25, 1], -1.3],
    ['ROUND', [1.005, 2], 1.01],
    ['ROUND', [-1.005, 2], -1.01],
    ['ROUND', [12.345, 2], 12.35],
    ['ROUND', [125, -1], 130],
    ['FLOOR', [2.1], 2],
    ['FLOOR', [-2.1], -3],
    ['FLOOR', [2], 2],
    ['CEILING', [2.1], 3],
    ['CEILING', [-2.1], -2],
    ['CEILING', [-2], -2],
    ['SQRT', [0], 0],
    ['SQRT', [81], 9],
    ['POWER', [2, -3], 0.125],
    ['POWER', [9, 0.5], 3],
    ['POWER', [-2, 3], -8],
    ['POWER', [-2, 4], 16],
    ['POWER', [5, 0], 1],
    ['POWER', [0, 0], 1],
    ['POWER', [0, 5], 0],
    ['MOD', [7, 3], 1],
    ['MOD', [-7, 3], 2],
    ['MOD', [7, -3], -2],
    ['MOD', [-7, -3], -1],
    ['MOD', [6, 3], 0],
    ['MOD', [6, -3], 0],
  ] as const)('%s evaluates %j', (name, values, expected) => {
    expect(evaluateFunction(name, ...values)).toBe(expected)
  })

  it('surfaces non-real or undefined results as non-finite numbers for the evaluator to reject', () => {
    expect(evaluateFunction('SQRT', -1)).toBeNaN()
    expect(evaluateFunction('POWER', -1, 0.5)).toBeNaN()
    expect(evaluateFunction('POWER', 0, -1)).toBe(Number.POSITIVE_INFINITY)
    expect(evaluateFunction('MOD', 1, 0)).toBeNaN()
    expect(evaluateFunction('MOD', 1, -0)).toBeNaN()
    expect(evaluateFunction('ROUND', 1.23, 1.5)).toBeNaN()
    expect(evaluateFunction('ROUND', 1.23, Number.POSITIVE_INFINITY)).toBeNaN()
  })
})
