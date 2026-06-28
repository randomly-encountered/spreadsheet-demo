import { describe, expect, it } from 'vitest'

import { EvaluationError } from '#/formula/evaluator'
import { CellError } from '#/spreadsheet/cell.error'
import { createSpreadsheetStore } from '#/spreadsheet/store'

function createSpreadsheet() {
  return createSpreadsheetStore().getState()
}

describe('SpreadsheetStore', () => {
  it('publishes a new cells map after an accepted edit', () => {
    const store = createSpreadsheetStore()
    const previousCells = store.getState().cells

    store.getState().setCell('A1', 'value')

    expect(store.getState().cells).not.toBe(previousCells)
  })

  it('starts with empty cells in the configured grid', () => {
    const spreadsheet = createSpreadsheet()

    expect(spreadsheet.selectedCellId).toBeNull()
    expect(spreadsheet.getCell('A1')).toEqual({ raw: '', value: null })
    expect(spreadsheet.getCell('J10')).toEqual({ raw: '', value: null })
  })

  it('fails store creation when an initial value is invalid', () => {
    expect(() =>
      createSpreadsheetStore({ initialValues: [['A1', '=1 +']] }),
    ).toThrowError(CellError)
  })

  it('preserves raw text as the displayed value', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', 'SpotGamma')
    expect(spreadsheet.getCell('A1')).toEqual({ raw: 'SpotGamma', value: 'SpotGamma' })
  })

  it('evaluates formulas while preserving their raw input', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '2')
    spreadsheet.setCell('B1', '3')

    spreadsheet.setCell('C1', '=A1 + B1 * 4')
    expect(spreadsheet.getCell('C1')).toEqual({ raw: '=A1 + B1 * 4', value: 14 })
  })

  it('treats empty referenced cells as zero', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('B1', '=A1 + 5')

    expect(spreadsheet.getCell('B1')).toEqual({ raw: '=A1 + 5', value: 5 })
  })

  it('stores finite numeric literals as canonical strings', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', ' 2.5 ')
    spreadsheet.setCell('A2', '089')
    spreadsheet.setCell('B1', '=A1 * 2')

    expect(spreadsheet.getCell('A1')).toEqual({ raw: '2.5', value: '2.5' })
    expect(spreadsheet.getCell('A2')).toEqual({ raw: '89', value: '89' })
    expect(spreadsheet.getCell('B1')).toEqual({ raw: '=A1 * 2', value: 5 })
  })

  it('evaluates ranges through the formula subsystem', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '2')
    spreadsheet.setCell('A2', '3')
    spreadsheet.setCell('A3', '5')
    spreadsheet.setCell('B1', '=SUM(A1:A3)')

    expect(spreadsheet.getCell('B1')).toEqual({ raw: '=SUM(A1:A3)', value: 10 })
  })

  it('recalculates direct and transitive dependents', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '2')
    spreadsheet.setCell('B1', '=A1 + 1')
    spreadsheet.setCell('C1', '=B1 * 3')

    spreadsheet.setCell('A1', '4')

    expect(spreadsheet.getCell('B1').value).toBe(5)
    expect(spreadsheet.getCell('C1').value).toBe(15)
  })

  it('recalculates a shared dependent after all of its changed inputs', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '1')
    spreadsheet.setCell('B1', '=A1 + 1')
    spreadsheet.setCell('C1', '=A1 + 2')
    spreadsheet.setCell('D1', '=B1 + C1')

    spreadsheet.setCell('A1', '10')

    expect(spreadsheet.getCell('D1').value).toBe(23)
  })

  it('replaces stale dependencies when a formula changes', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '1')
    spreadsheet.setCell('B1', '2')
    spreadsheet.setCell('C1', '=A1')
    spreadsheet.setCell('C1', '=B1')
    spreadsheet.setCell('A1', '10')

    expect(spreadsheet.getCell('C1').value).toBe(2)

    spreadsheet.setCell('B1', '20')

    expect(spreadsheet.getCell('C1').value).toBe(20)
  })

  it('clears formula dependencies when replaced with text', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '1')
    spreadsheet.setCell('B1', '=A1')
    spreadsheet.setCell('B1', 'fixed')
    spreadsheet.setCell('A1', '2')

    expect(spreadsheet.getCell('B1')).toEqual({ raw: 'fixed', value: 'fixed' })
  })

  it('rejects a cycle and preserves the previously accepted cell state', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '=B1 + 1')
    spreadsheet.setCell('B1', '2')

    expect(() => spreadsheet.setCell('B1', '=A1 + 1')).toThrowError(
      new CellError('cycle', 'Formula creates a circular dependency'),
    )
    expect(spreadsheet.getCell('B1')).toEqual({ raw: '2', value: '2' })
    expect(spreadsheet.getCell('A1')).toEqual({ raw: '=B1 + 1', value: 3 })
  })

  it('rejects invalid formula syntax without replacing accepted state', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', 'valid')
    expect(() => spreadsheet.setCell('A1', '=1 +')).toThrowError(CellError)
    expect(spreadsheet.getCell('A1')).toEqual({ raw: 'valid', value: 'valid' })
  })

  it('rejects formulas that reference nonnumeric text', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', 'words')
    expect(() => spreadsheet.setCell('B1', '=A1 + 1')).toThrowError(EvaluationError)
    expect(spreadsheet.getCell('B1')).toEqual({ raw: '', value: null })
  })

  it('marks affected formulas when an accepted edit makes them invalid', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '2')
    spreadsheet.setCell('B1', '=A1 + 1')

    spreadsheet.setCell('A1', 'words')
    expect(spreadsheet.getCell('B1')).toMatchObject({
      error: { type: 'reference' },
      raw: '=A1 + 1',
    })
  })

  it('clears a dependent error after its input becomes valid again', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('A1', '2')
    spreadsheet.setCell('B1', '=A1 + 1')
    spreadsheet.setCell('A1', 'words')
    spreadsheet.setCell('A1', '4')

    expect(spreadsheet.getCell('B1')).toEqual({ raw: '=A1 + 1', value: 5 })
  })

  it('normalizes lowercase cell IDs and formula references', () => {
    const spreadsheet = createSpreadsheet()

    spreadsheet.setCell('a1', '2')
    spreadsheet.setCell('b1', '=a1 + 1')

    expect(spreadsheet.getCell('A1').value).toBe('2')
    expect(spreadsheet.getCell('B1').value).toBe(3)
  })

  it('rejects cell IDs outside the configured grid', () => {
    const spreadsheet = createSpreadsheet()

    expect(() => spreadsheet.getCell('K1')).toThrow('Cell K1 is outside the spreadsheet')
    expect(() => spreadsheet.setCell('A11', 'value')).toThrow('Cell A11 is outside the spreadsheet')
  })

  it('rejects malformed cell IDs without calling them out of bounds', () => {
    const spreadsheet = createSpreadsheet()

    expect(() => spreadsheet.getCell('not-a-cell')).toThrow(
      'Invalid cell reference NOT-A-CELL',
    )
  })
})
