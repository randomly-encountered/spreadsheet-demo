export const FORMULA_FUNCTION_NAMES = [
  'ABS',
  'AVERAGE',
  'CEILING',
  'COUNT',
  'FLOOR',
  'MAX',
  'MIN',
  'MOD',
  'POWER',
  'PRODUCT',
  'ROUND',
  'SQRT',
  'SUM',
] as const

export type FormulaFunctionName = (typeof FORMULA_FUNCTION_NAMES)[number]

export type FormulaFunctionDefinition = {
  readonly evaluate: (values: readonly number[]) => number
  readonly acceptsRanges: boolean
  readonly maximumArguments: number | null
  readonly minimumArguments: number
}
