import styles from '#/components/Spreadsheet/FormulaBar.module.css'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

function FormulaBar() {
  const cellId = useSpreadsheetStore((state) => state.selectedCellId)
  const rawValue = useSpreadsheetStore((state) => state.cells.get(cellId)?.raw ?? '')

  return (
    <div aria-label="Selected cell value" className={styles.container}>
      <output aria-label="Selected cell" className={styles.coordinate}>
        {cellId}
      </output>
      <span aria-hidden="true" className={styles.symbol}>
        fx
      </span>
      <input
        readOnly
        aria-label={`Raw value for ${cellId}`}
        className={styles.input}
        value={rawValue}
      />
    </div>
  )
}

export default FormulaBar
