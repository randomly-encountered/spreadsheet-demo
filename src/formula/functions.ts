import type { FormulaFunctionDefinition } from '#/formula/functions.types'

const definitions: readonly FormulaFunctionDefinition[] = Object.freeze([])

export const getFormulaFunction = (_name: string): FormulaFunctionDefinition | undefined => undefined

export const listFormulaFunctions = (): readonly FormulaFunctionDefinition[] => definitions
