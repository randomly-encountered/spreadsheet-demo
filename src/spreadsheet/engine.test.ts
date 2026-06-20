import { describe, expect, it } from 'vitest'

import { EvaluationError } from '#/formula/evaluator'
import { CellError } from '#/spreadsheet/cell.error'
import { createSpreadsheetEngine } from '#/spreadsheet/engine'

describe('SpreadsheetEngine', () => {
  it('starts with empty cells in the configured grid', () => {
    const engine = createSpreadsheetEngine()

    expect(engine.getCell('A1')).toEqual({ raw: '', value: null })
    expect(engine.getCell('J10')).toEqual({ raw: '', value: null })
  })

  it('preserves raw text as the displayed value', () => {
    const engine = createSpreadsheetEngine()

    expect(engine.setCell('A1', 'SpotGamma')).toEqual({ accepted: true })
    expect(engine.getCell('A1')).toEqual({ raw: 'SpotGamma', value: 'SpotGamma' })
  })

  it('evaluates formulas while preserving their raw input', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '2')
    engine.setCell('B1', '3')

    expect(engine.setCell('C1', '=A1 + B1 * 4')).toEqual({ accepted: true })
    expect(engine.getCell('C1')).toEqual({ raw: '=A1 + B1 * 4', value: 14 })
  })

  it('treats empty referenced cells as zero', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('B1', '=A1 + 5')

    expect(engine.getCell('B1')).toEqual({ raw: '=A1 + 5', value: 5 })
  })

  it('coerces numeric-looking text only when a formula references it', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', ' 2.5 ')
    engine.setCell('B1', '=A1 * 2')

    expect(engine.getCell('A1')).toEqual({ raw: ' 2.5 ', value: ' 2.5 ' })
    expect(engine.getCell('B1')).toEqual({ raw: '=A1 * 2', value: 5 })
  })

  it('evaluates ranges through the formula subsystem', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '2')
    engine.setCell('A2', '3')
    engine.setCell('A3', '5')
    engine.setCell('B1', '=SUM(A1:A3)')

    expect(engine.getCell('B1')).toEqual({ raw: '=SUM(A1:A3)', value: 10 })
  })

  it('recalculates direct and transitive dependents', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '2')
    engine.setCell('B1', '=A1 + 1')
    engine.setCell('C1', '=B1 * 3')

    engine.setCell('A1', '4')

    expect(engine.getCell('B1').value).toBe(5)
    expect(engine.getCell('C1').value).toBe(15)
  })

  it('recalculates a shared dependent after all of its changed inputs', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '1')
    engine.setCell('B1', '=A1 + 1')
    engine.setCell('C1', '=A1 + 2')
    engine.setCell('D1', '=B1 + C1')

    engine.setCell('A1', '10')

    expect(engine.getCell('D1').value).toBe(23)
  })

  it('replaces stale dependencies when a formula changes', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '1')
    engine.setCell('B1', '2')
    engine.setCell('C1', '=A1')
    engine.setCell('C1', '=B1')
    engine.setCell('A1', '10')

    expect(engine.getCell('C1').value).toBe(2)

    engine.setCell('B1', '20')

    expect(engine.getCell('C1').value).toBe(20)
  })

  it('clears formula dependencies when replaced with text', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '1')
    engine.setCell('B1', '=A1')
    engine.setCell('B1', 'fixed')
    engine.setCell('A1', '2')

    expect(engine.getCell('B1')).toEqual({ raw: 'fixed', value: 'fixed' })
  })

  it('rejects a cycle and preserves the previously accepted cell state', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '=B1 + 1')
    engine.setCell('B1', '2')

    const result = engine.setCell('B1', '=A1 + 1')

    expect(result.error).toBeInstanceOf(CellError)
    expect(result).toMatchObject({
      accepted: false,
      error: { message: 'Formula creates a circular dependency', type: 'cycle' }
    })
    expect(engine.getCell('B1')).toEqual({ raw: '2', value: '2' })
    expect(engine.getCell('A1')).toEqual({ raw: '=B1 + 1', value: 3 })
  })

  it('rejects invalid formula syntax without replacing accepted state', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', 'valid')
    const result = engine.setCell('A1', '=1 +')

    expect(result.accepted).toBe(false)
    expect(result.error).toBeInstanceOf(CellError)
    expect(result.error?.type).toBe('formula')
    expect(engine.getCell('A1')).toEqual({ raw: 'valid', value: 'valid' })
  })

  it('rejects formulas that reference nonnumeric text', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', 'words')
    const result = engine.setCell('B1', '=A1 + 1')

    expect(result.accepted).toBe(false)
    expect(result.error).toBeInstanceOf(EvaluationError)
    expect(result.error?.type).toBe('reference')
    expect(engine.getCell('B1')).toEqual({ raw: '', value: null })
  })

  it('marks affected formulas when an accepted edit makes them invalid', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '2')
    engine.setCell('B1', '=A1 + 1')

    expect(engine.setCell('A1', 'words')).toEqual({ accepted: true })
    expect(engine.getCell('B1')).toMatchObject({
      error: { type: 'reference' },
      raw: '=A1 + 1'
    })
  })

  it('clears a dependent error after its input becomes valid again', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('A1', '2')
    engine.setCell('B1', '=A1 + 1')
    engine.setCell('A1', 'words')
    engine.setCell('A1', '4')

    expect(engine.getCell('B1')).toEqual({ raw: '=A1 + 1', value: 5 })
  })

  it('normalizes lowercase cell IDs and formula references', () => {
    const engine = createSpreadsheetEngine()

    engine.setCell('a1', '2')
    engine.setCell('b1', '=a1 + 1')

    expect(engine.getCell('A1').value).toBe('2')
    expect(engine.getCell('B1').value).toBe(3)
  })

  it('rejects cell IDs outside the configured grid', () => {
    const engine = createSpreadsheetEngine()

    expect(() => engine.getCell('K1')).toThrow('Cell K1 is outside the spreadsheet')
    expect(() => engine.setCell('A11', 'value')).toThrow('Cell A11 is outside the spreadsheet')
  })
})
