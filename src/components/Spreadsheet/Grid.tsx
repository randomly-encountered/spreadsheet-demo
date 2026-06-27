import type { MouseEvent, KeyboardEvent, RefObject } from 'react'

import Cell from '#/components/Spreadsheet/Cell'
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
  gridRef: RefObject<HTMLDivElement | null>
  onEditCell: () => void
}

function Grid({ gridRef, onEditCell }: GridProps) {
  const selectedCellId = useSpreadsheetStore(state => state.selectedCellId)
  const selectCell = useSpreadsheetStore(state => state.selectCell)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      onEditCell()
      return
    }

    const nextIndex = getNextCellIndex(getCellIndex(selectedCellId), event.key)

    if (nextIndex === null) return

    event.preventDefault()
    selectCell(getCellId(nextIndex))
  }

  function handleClick(event: MouseEvent<HTMLDivElement>): void {
    if (!(event.target instanceof Element)) return

    const cellId = event.target.closest<HTMLElement>('[role="gridcell"]')?.dataset.cellId
    if (!cellId) return

    selectCell(cellId)
    gridRef.current?.focus()
  }

  return (
    <div
      aria-activedescendant={getCellElementId(selectedCellId)}
      aria-colcount={COLUMN_COUNT + 1}
      aria-label="Spreadsheet"
      aria-rowcount={ROW_COUNT + 1}
      className={styles.scrollRegion}
      ref={gridRef}
      role="grid"
      tabIndex={0}
      onClick={handleClick}
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
              return <Cell cellId={cellId} key={cellId} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Grid
