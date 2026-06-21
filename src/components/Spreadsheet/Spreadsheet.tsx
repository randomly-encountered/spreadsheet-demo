import { useState } from 'react'

import { COLUMN_COUNT, getCellId, ROW_COUNT } from '#/components/Spreadsheet/constants'
import FormulaBar from '#/components/Spreadsheet/FormulaBar'
import Grid from '#/components/Spreadsheet/Grid'
import styles from '#/components/Spreadsheet/Spreadsheet.module.css'
import { createSpreadsheetEngine } from '#/spreadsheet/engine'

/*
 * Very temporary initial values to populate grid to test/prove state propagation and
 * formula parsing is working.
 */
const INITIAL_VALUES = [
  ['A1', '120'],
  ['B1', '80'],
  ['C1', '=A1+B1']
] as const

function Spreadsheet() {
  /*
   * Again we are temporarily initially setting values here.
   * This can be removed in future iterations as we wire up user-defined cell formula.
   */
  const [engine] = useState(() => {
    const engine = createSpreadsheetEngine({ columns: COLUMN_COUNT, rows: ROW_COUNT })

    for (const [cellId, raw] of INITIAL_VALUES) engine.setCell(cellId, raw)

    return engine
  })

  const [selectedCellId, setSelectedCellId] = useState(() => getCellId(0))

  return (
    <div className={styles.container}>
      <FormulaBar cellId={selectedCellId} rawValue={engine.getCell(selectedCellId).raw} />
      <Grid engine={engine} selectedCellId={selectedCellId} onSelectCell={setSelectedCellId} />
    </div>
  )
}

export default Spreadsheet
