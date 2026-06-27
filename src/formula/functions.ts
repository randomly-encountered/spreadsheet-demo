import { type FormulaFunctionDefinition, type FormulaFunctionName } from '#/formula/functions.types'

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0)

/** Moves the decimal point without multiplying through a binary floating-point boundary. */
const shiftDecimal = (value: number, places: number): number => {
  const [coefficient, exponent = '0'] = String(value).split('e')
  return Number(`${coefficient}e${Number(exponent) + places}`)
}

/** Implements spreadsheet rounding: decimal midpoints move away from zero. */
const round = ([value = Number.NaN, places = 0]: readonly number[]): number => {
  if (!Number.isFinite(value) || !Number.isSafeInteger(places)) {
    return Number.NaN
  }

  const shifted = shiftDecimal(Math.abs(value), places)

  if (!Number.isFinite(shifted)) {
    return value
  }

  const rounded = shiftDecimal(Math.round(shifted), -places)

  return Math.sign(value) * rounded
}

/** Implements spreadsheet modulo, whose result follows the divisor's sign. */
const modulo = ([dividend = Number.NaN, divisor = Number.NaN]: readonly number[]): number => {
  if (divisor === 0) {
    return Number.NaN
  }

  const remainder = dividend % divisor

  if (remainder === 0) {
    return 0
  }

  return Math.sign(remainder) === Math.sign(divisor) ? remainder : remainder + divisor
}

const definitionsByName = new Map<FormulaFunctionName, FormulaFunctionDefinition>([
  [
    'ABS',
    {
      evaluate: ([value = Number.NaN]) => Math.abs(value),
      acceptsRanges: false,
      maximumArguments: 1,
      minimumArguments: 1,
    },
  ],
  [
    'AVERAGE',
    {
      evaluate: values => sum(values) / values.length,
      acceptsRanges: true,
      maximumArguments: null,
      minimumArguments: 1,
    },
  ],
  [
    'CEILING',
    {
      evaluate: ([value = Number.NaN]) => Math.ceil(value),
      acceptsRanges: false,
      maximumArguments: 1,
      minimumArguments: 1,
    },
  ],
  [
    'COUNT',
    {
      evaluate: values => values.length,
      acceptsRanges: true,
      maximumArguments: null,
      minimumArguments: 1,
    },
  ],
  [
    'FLOOR',
    {
      evaluate: ([value = Number.NaN]) => Math.floor(value),
      acceptsRanges: false,
      maximumArguments: 1,
      minimumArguments: 1,
    },
  ],
  [
    'MAX',
    {
      evaluate: values => values.reduce((maximum, value) => Math.max(maximum, value), -Infinity),
      acceptsRanges: true,
      maximumArguments: null,
      minimumArguments: 1,
    },
  ],
  [
    'MIN',
    {
      evaluate: values => values.reduce((minimum, value) => Math.min(minimum, value), Infinity),
      acceptsRanges: true,
      maximumArguments: null,
      minimumArguments: 1,
    },
  ],
  [
    'MOD',
    {
      acceptsRanges: false,
      evaluate: modulo,
      maximumArguments: 2,
      minimumArguments: 2,
    },
  ],
  [
    'POWER',
    {
      evaluate: ([base = Number.NaN, exponent = Number.NaN]) => base ** exponent,
      acceptsRanges: false,
      maximumArguments: 2,
      minimumArguments: 2,
    },
  ],
  [
    'PRODUCT',
    {
      evaluate: values => values.reduce((product, value) => product * value, 1),
      acceptsRanges: true,
      maximumArguments: null,
      minimumArguments: 1,
    },
  ],
  [
    'ROUND',
    {
      acceptsRanges: false,
      evaluate: round,
      maximumArguments: 2,
      minimumArguments: 1,
    },
  ],
  [
    'SQRT',
    {
      evaluate: ([value = Number.NaN]) => Math.sqrt(value),
      acceptsRanges: false,
      maximumArguments: 1,
      minimumArguments: 1,
    },
  ],
  [
    'SUM',
    {
      acceptsRanges: true,
      evaluate: sum,
      maximumArguments: null,
      minimumArguments: 1,
    },
  ],
])

export const getFormulaFunction = (name: string): FormulaFunctionDefinition | undefined => {
  if (!/^[A-Za-z]+$/.test(name)) {
    return undefined
  }

  return definitionsByName.get(name.toUpperCase() as FormulaFunctionName)
}
