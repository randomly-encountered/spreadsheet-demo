import type { FocusEvent, RefObject } from 'react'

import styles from '#/components/Spreadsheet/FormulaBar.module.css'
import { FormulaInput } from '#/components/Spreadsheet/FormulaInput'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type FormulaBarProps = {
  ref: RefObject<HTMLInputElement | null>
  onConfirm: () => void
  onEditingChange: (isEditing: boolean) => void
}

export function FormulaBar({ ref, onConfirm, onEditingChange }: FormulaBarProps) {
  const cellId = useSpreadsheetStore(state => state.selectedCellId)

  function handleBlur(event: FocusEvent<HTMLDivElement>): void {
    if (!event.currentTarget.contains(event.relatedTarget)) onEditingChange(false)
  }

  function handleFocus(): void {
    if (cellId !== null) onEditingChange(true)
  }

  return (
    <div className={styles.container} onBlur={handleBlur} onFocus={handleFocus}>
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
