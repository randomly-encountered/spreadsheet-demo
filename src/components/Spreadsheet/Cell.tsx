import styles from '#/components/Spreadsheet/Cell.module.css'
import { getCellElementId } from '#/components/Spreadsheet/constants'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type CellProps = {
  cellId: string
}

function Cell({ cellId }: CellProps) {
  const isSelected = useSpreadsheetStore(state => state.selectedCellId === cellId)
  const cell = useSpreadsheetStore(state => state.cells.get(cellId))
  const value = cell?.value ?? ''
  const isDerived = cell?.raw.startsWith('=') ?? false

  return (
    <div
      aria-label={`${cellId}${value === '' ? ', empty' : `, ${value}`}`}
      aria-selected={isSelected}
      className={styles.cell}
      data-cell-id={cellId}
      data-derived={isDerived ? true : undefined}
      id={getCellElementId(cellId)}
      role="gridcell"
    >
      <span className={styles.value}>{value}</span>
    </div>
  )
}

export default Cell
