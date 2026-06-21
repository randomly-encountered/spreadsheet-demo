import type { KeyboardEvent } from 'react'

import Cell from '#/components/Spreadsheet/Cell'
import {
  COLUMN_COUNT,
  COLUMN_LABELS,
  getCellId,
  ROW_COUNT
} from '#/components/Spreadsheet/constants'
import { getNextCellIndex } from '#/components/Spreadsheet/Grid.helpers'
import styles from '#/components/Spreadsheet/Grid.module.css'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

function Grid() {
  const selectCell = useSpreadsheetStore((state) => state.selectCell)

  function handleCellKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number): void {
    const nextIndex = getNextCellIndex(index, event.key)

    if (nextIndex === null) return

    event.preventDefault()
    selectCell(getCellId(nextIndex))
  }

  return (
    <div className={styles.scrollRegion}>
      <div
        aria-colcount={COLUMN_COUNT + 1}
        aria-label="Spreadsheet"
        aria-rowcount={ROW_COUNT + 1}
        className={styles.grid}
        role="grid"
      >
        <div className={styles.row} role="row">
          <span aria-label="Row" className={styles.corner} role="columnheader" />
          {COLUMN_LABELS.map((label) => (
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
            {COLUMN_LABELS.map((column, columnIndex) => {
              const index = row * COLUMN_COUNT + columnIndex
              const cellId = `${column}${row + 1}`
              return (
                <Cell
                  cellId={cellId}
                  key={cellId}
                  onKeyDown={(event) => handleCellKeyDown(event, index)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Grid
