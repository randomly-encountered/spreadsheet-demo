import styles from '#/components/Spreadsheet/FormulaBar.module.css'

type FormulaBarProps = {
  cellId: string
  rawValue: string
}

function FormulaBar({ cellId, rawValue }: FormulaBarProps) {
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
