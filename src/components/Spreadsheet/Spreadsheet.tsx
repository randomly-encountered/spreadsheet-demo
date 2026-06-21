import { COLUMN_COUNT, ROW_COUNT } from '#/components/Spreadsheet/constants'
import FormulaBar from '#/components/Spreadsheet/FormulaBar'
import Grid from '#/components/Spreadsheet/Grid'
import styles from '#/components/Spreadsheet/Spreadsheet.module.css'
import { SpreadsheetProvider } from '#/components/Spreadsheet/SpreadsheetProvider'

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
  return (
    <SpreadsheetProvider columns={COLUMN_COUNT} initialValues={INITIAL_VALUES} rows={ROW_COUNT}>
      <div className={styles.container}>
        <FormulaBar />
        <Grid />
      </div>
    </SpreadsheetProvider>
  )
}

export default Spreadsheet
