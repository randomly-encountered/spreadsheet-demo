import type { Expression } from '#/formula/ast.types'
import { EvaluationError } from '#/formula/evaluator.error'
import {
  isFiniteResult,
  getNormalizedCellId,
  iterateRange,
  readRangeCellValue,
  readReferencedCellValue,
} from '#/formula/evaluator.helpers'
import type { CellValueLookup } from '#/formula/evaluator.types'
import { getFormulaFunction } from '#/formula/functions'

export { EvaluationError } from '#/formula/evaluator.error'

const evaluateScalar = (expression: Expression, lookup: CellValueLookup): number | null => {
  switch (expression.type) {
    case 'numberLiteral':
      return expression.value
    case 'cellReference':
      return readReferencedCellValue(expression.reference, lookup)
    case 'rangeReference':
      throw new EvaluationError('range-not-allowed', 'A range must be a function argument')
    case 'unaryExpression': {
      const operand = evaluateScalar(expression.operand, lookup)
      if (operand === null) return null
      return expression.operator === '-' ? -operand : operand
    }
    case 'binaryExpression': {
      const left = evaluateScalar(expression.left, lookup)
      const right = evaluateScalar(expression.right, lookup)
      if (left === null || right === null) return null

      switch (expression.operator) {
        case '+':
          return isFiniteResult(left + right)
        case '-':
          return isFiniteResult(left - right)
        case '*':
          return isFiniteResult(left * right)
        case '/':
          if (right === 0) {
            throw new EvaluationError('division-by-zero', 'Cannot divide by zero')
          }
          return isFiniteResult(left / right)
        case '^':
          return isFiniteResult(left ** right)
        default:
          throw new EvaluationError('calculation', 'Unsupported binary operator')
      }
    }
    case 'functionCall': {
      const definition = getFormulaFunction(expression.name)

      if (!definition) {
        throw new EvaluationError('unsupported-function', `Unsupported function ${expression.name}`)
      }

      const argumentCount = expression.arguments.length
      if (
        argumentCount < definition.minimumArguments
        || (definition.maximumArguments !== null && argumentCount > definition.maximumArguments)
      ) {
        throw new EvaluationError(
          'argument-count',
          `${expression.name} received ${argumentCount} arguments`,
        )
      }

      const values: number[] = []

      for (const argument of expression.arguments) {
        if (argument.type !== 'rangeReference') {
          const value = evaluateScalar(argument, lookup)
          if (value === null) return null
          values.push(value)
          continue
        }

        if (!definition.acceptsRanges) {
          throw new EvaluationError(
            'range-not-allowed',
            `${expression.name} does not accept ranges`,
          )
        }

        for (const reference of iterateRange(argument)) {
          const value = readRangeCellValue(reference, lookup)
          if (value !== null) values.push(value)
        }
      }

      if (values.length === 0) return null
      return isFiniteResult(definition.evaluate(values))
    }
  }
}

/** Evaluates a parsed formula using numeric values supplied by the spreadsheet layer. */
export const evaluate = (expression: Expression, lookup: CellValueLookup): number | null => {
  const value = evaluateScalar(expression, lookup)
  return value === null ? null : isFiniteResult(value)
}

/** Returns normalized cell references, expanding ranges and removing duplicates. */
export const collectReferencedCellIds = (expression: Expression): Set<string> => {
  const referencedCellIds = new Set<string>()

  const visit = (node: Expression): void => {
    switch (node.type) {
      case 'numberLiteral':
        return
      case 'cellReference':
        referencedCellIds.add(getNormalizedCellId(node.reference))
        return
      case 'rangeReference':
        for (const referencedCellId of iterateRange(node)) {
          referencedCellIds.add(referencedCellId)
        }
        return
      case 'unaryExpression':
        visit(node.operand)
        return
      case 'binaryExpression':
        visit(node.left)
        visit(node.right)
        return
      case 'functionCall':
        node.arguments.forEach(visit)
    }
  }

  visit(expression)
  return referencedCellIds
}
