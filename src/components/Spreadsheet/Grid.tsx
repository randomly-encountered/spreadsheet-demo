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
import type { SpreadsheetEngine } from '#/spreadsheet/types'

type GridProps = {
  engine: SpreadsheetEngine
  selectedCellId: string
  onSelectCell: (cellId: string) => void
}

function Grid({ engine, selectedCellId, onSelectCell }: GridProps) {
  function handleCellKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number): void {
    const nextIndex = getNextCellIndex(index, event.key)

    if (nextIndex === null) return

    event.preventDefault()
    onSelectCell(getCellId(nextIndex))
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
              const value = engine.getCell(cellId).value ?? ''
              console.log(value)

              return (
                <Cell
                  cellId={cellId}
                  isSelected={selectedCellId === cellId}
                  key={cellId}
                  value={value}
                  onKeyDown={(event) => handleCellKeyDown(event, index)}
                  onSelect={() => onSelectCell(cellId)}
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
