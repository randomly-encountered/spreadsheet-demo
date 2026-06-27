import { useCallback, useRef } from 'react'

import { COLUMN_COUNT, ROW_COUNT } from '#/components/Spreadsheet/constants'
import FormulaBar from '#/components/Spreadsheet/FormulaBar'
import Grid from '#/components/Spreadsheet/Grid'
import styles from '#/components/Spreadsheet/Spreadsheet.module.css'
import { SpreadsheetProvider } from '#/components/Spreadsheet/SpreadsheetProvider'

function SpreadsheetWorkspace() {
  const formulaInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const focusFormulaInput = useCallback(() => {
    formulaInputRef.current?.focus()
    formulaInputRef.current?.select()
  }, [])

  const focusGrid = useCallback(() => {
    gridRef.current?.focus()
  }, [])

  return (
    <div className={styles.container}>
      <FormulaBar inputRef={formulaInputRef} onEditingComplete={focusGrid} />
      <Grid gridRef={gridRef} onEditCell={focusFormulaInput} />
    </div>
  )
}

function Spreadsheet() {
  return (
    <SpreadsheetProvider columns={COLUMN_COUNT} rows={ROW_COUNT}>
      <SpreadsheetWorkspace />
    </SpreadsheetProvider>
  )
}

export default Spreadsheet
