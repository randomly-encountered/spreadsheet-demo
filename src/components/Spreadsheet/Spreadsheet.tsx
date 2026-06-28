import { useRef } from 'react'

import { COLUMN_COUNT, ROW_COUNT } from '#/components/Spreadsheet/constants'
import { FormulaBar } from '#/components/Spreadsheet/FormulaBar'
import { Grid } from '#/components/Spreadsheet/Grid'
import styles from '#/components/Spreadsheet/Spreadsheet.module.css'
import { SpreadsheetProvider } from '#/components/Spreadsheet/SpreadsheetProvider'

export function Spreadsheet() {
  const formulaInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  function focusFormulaInput(): void {
    formulaInputRef.current?.focus()
    formulaInputRef.current?.select()
  }

  function focusGrid(): void {
    gridRef.current?.focus()
  }

  return (
    <SpreadsheetProvider columns={COLUMN_COUNT} rows={ROW_COUNT}>
      <div className={styles.container}>
        <FormulaBar ref={formulaInputRef} onConfirm={focusGrid} />
        <Grid ref={gridRef} onEditCell={focusFormulaInput} />
      </div>
    </SpreadsheetProvider>
  )
}
