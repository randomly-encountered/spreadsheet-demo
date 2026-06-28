import type { RefObject } from 'react'

import styles from '#/components/Spreadsheet/FormulaBar.module.css'
import { FormulaInput } from '#/components/Spreadsheet/FormulaInput'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type FormulaBarProps = {
  ref: RefObject<HTMLInputElement | null>
  onConfirm: () => void
}

export function FormulaBar({ ref, onConfirm }: FormulaBarProps) {
  const cellId = useSpreadsheetStore(state => state.selectedCellId)

  return (
    <div className={styles.container}>
      <span className={styles.coordinate}>{cellId ?? ''}</span>
      <span aria-hidden="true" className={styles.symbol}>
        fx
      </span>
      <FormulaInput
        cellId={cellId}
        key={cellId ?? 'no-selection'}
        ref={ref}
        onConfirm={onConfirm}
      />
    </div>
  )
}
