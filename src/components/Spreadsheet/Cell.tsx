import styles from '#/components/Spreadsheet/Cell.module.css'
import { getCellElementId } from '#/components/Spreadsheet/constants'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type CellProps = {
  cellId: string
  onSelect: (cellId: string) => void
}

export function Cell({ cellId, onSelect }: CellProps) {
  const isSelected = useSpreadsheetStore(state => state.selectedCellId === cellId)
  const cell = useSpreadsheetStore(state => state.cells.get(cellId))
  const value = cell?.value ?? ''
  const isDerived = cell?.raw.startsWith('=') ?? false

  function handlePointerDown(): void {
    onSelect(cellId)
  }

  return (
    <div
      aria-label={`${cellId}${value === '' ? ', empty' : `, ${value}`}`}
      aria-selected={isSelected}
      className={styles.cell}
      data-derived={isDerived ? true : undefined}
      id={getCellElementId(cellId)}
      role="gridcell"
      onPointerDown={handlePointerDown}
    >
      <span className={styles.value}>{value}</span>
    </div>
  )
}
