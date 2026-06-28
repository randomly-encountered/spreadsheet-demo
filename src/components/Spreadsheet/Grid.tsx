import { useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'

import { Cell } from '#/components/Spreadsheet/Cell'
import {
  COLUMN_COUNT,
  COLUMN_LABELS,
  getCellElementId,
  getCellId,
  getCellIndex,
  ROW_COUNT,
} from '#/components/Spreadsheet/constants'
import { getNextCellIndex } from '#/components/Spreadsheet/Grid.helpers'
import styles from '#/components/Spreadsheet/Grid.module.css'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type GridProps = {
  ref: RefObject<HTMLDivElement | null>
  onEditCell: () => void
}

export function Grid({ ref, onEditCell }: GridProps) {
  const hasFocusRef = useRef(false)
  const selectedCellId = useSpreadsheetStore(state => state.selectedCellId)
  const selectCell = useSpreadsheetStore(state => state.selectCell)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (selectedCellId === null) return
    if (event.key === 'Enter') {
      event.preventDefault()
      onEditCell()
      return
    }

    // determine if cell navigation is taking place via keyboard arrow keys.
    const nextIndex = getNextCellIndex(getCellIndex(selectedCellId), event.key)

    if (nextIndex === null) return

    event.preventDefault()
    selectCell(getCellId(nextIndex))
  }

  function handleSelectCell(cellId: string): void {
    hasFocusRef.current = true
    selectCell(cellId)
    ref.current?.focus()
  }

  function handleFocus(): void {
    if (hasFocusRef.current) {
      hasFocusRef.current = false
      return
    }

    if (selectedCellId === null) selectCell(getCellId(0))
  }

  return (
    <div
      aria-activedescendant={selectedCellId ? getCellElementId(selectedCellId) : undefined}
      aria-colcount={COLUMN_COUNT + 1}
      aria-label="Spreadsheet"
      aria-rowcount={ROW_COUNT + 1}
      className={styles.scrollRegion}
      ref={ref}
      role="grid"
      tabIndex={0}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.grid}>
        <div className={styles.row} role="row">
          <span aria-label="Row" className={styles.corner} role="columnheader" />
          {COLUMN_LABELS.map(label => (
            <span className={styles.columnHeader} key={label} role="columnheader">
              {label}
            </span>
          ))}
        </div>

        {Array.from({ length: ROW_COUNT }, (_, row) => (
          <div className={styles.row} key={row} role="row">
            <span className={styles.rowHeader} role="rowheader">
              {row + 1}
            </span>
            {COLUMN_LABELS.map((column) => {
              const cellId = `${column}${row + 1}`
              return <Cell cellId={cellId} key={cellId} onSelect={handleSelectCell} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
