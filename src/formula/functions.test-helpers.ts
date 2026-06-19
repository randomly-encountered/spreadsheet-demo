import { getFormulaFunction } from '#/formula/functions'
import type { FormulaFunctionDefinition, FormulaFunctionName } from '#/formula/functions.types'

/**
 * Evaluates a known function directly so registry tests stay independent of the future evaluator.
 */
export const evaluateFunction = (name: FormulaFunctionName, ...values: number[]): number =>
  requireFormulaFunction(name).evaluate(values)

/**
 * Retrieves a registry entry or stops the current test with a focused failure.
 * Lookup tests accept arbitrary strings, so this helper intentionally does too.
 */
export const requireFormulaFunction = (name: string): FormulaFunctionDefinition => {
  const definition = getFormulaFunction(name)

  if (definition === undefined) {
    throw new Error(`Expected ${name} to be registered`)
  }

  return definition
}

/** Produces mixed-case ASCII names to verify normalization for every registry entry. */
export const toMixedCase = (name: FormulaFunctionName): string =>
  [...name]
    .map((character, index) => (index % 2 === 0 ? character.toLowerCase() : character))
    .join('')
