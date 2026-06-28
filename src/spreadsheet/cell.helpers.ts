export const FORMULA_PREFIX = '='

export function isFormula(raw: null | string | undefined): boolean {
  return raw?.startsWith(FORMULA_PREFIX) ?? false
}
