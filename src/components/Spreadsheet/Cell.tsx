import { useEffect, useRef } from 'react'
import type { KeyboardEventHandler } from 'react'

import styles from '#/components/Spreadsheet/Cell.module.css'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type CellProps = {
  cellId: string
  onKeyDown: KeyboardEventHandler<HTMLDivElement>
}

function Cell({ cellId, onKeyDown }: CellProps) {
  const cellRef = useRef<HTMLDivElement>(null)
  const isSelected = useSpreadsheetStore((state) => state.selectedCellId === cellId)
  const selectCell = useSpreadsheetStore((state) => state.selectCell)
  const value = useSpreadsheetStore((state) => state.cells.get(cellId)?.value ?? '')

  useEffect(() => {
    if (!isSelected) return

    cellRef.current?.focus()
  }, [isSelected])

  return (
    <div
      aria-label={`${cellId}${value === '' ? ', empty' : `, ${value}`}`}
      aria-selected={isSelected}
      className={styles.cell}
      ref={cellRef}
      role="gridcell"
      tabIndex={isSelected ? 0 : -1}
      onFocus={isSelected ? undefined : () => selectCell(cellId)}
      onKeyDown={onKeyDown}
    >
      {value}
    </div>
  )
}

export default Cell
