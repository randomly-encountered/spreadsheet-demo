import styles from '#/components/Spreadsheet/Cell.module.css'
import { getCellElementId } from '#/components/Spreadsheet/constants'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'
import { isFormula } from '#/spreadsheet/cell.helpers'

type CellProps = {
  cellId: string
  isEditing: boolean
  onEdit: (cellId: string) => void
  onSelect: (cellId: string) => void
}

export function Cell({ cellId, isEditing, onEdit, onSelect }: CellProps) {
  const isSelected = useSpreadsheetStore(state => state.selectedCellId === cellId)
  const cell = useSpreadsheetStore(state => state.cells.get(cellId))
  const isDependency = useSpreadsheetStore((state) => {
    const selectedCellId = state.selectedCellId
    if (selectedCellId === null) return false

    const selectedCell = state.cells.get(selectedCellId)
    return isFormula(selectedCell?.raw)
      && state.getDependencyLocusFor(selectedCellId).has(cellId)
  })

  const value = cell?.value ?? ''
  const isDerived = isFormula(cell?.raw)
  const error = cell?.error
  const valueLabel = value === '' ? 'empty' : value
  const ariaLabel = error
    ? `${cellId}, error: ${error.message}`
    : `${cellId}, ${valueLabel}`

  function handlePointerDown(): void {
    onSelect(cellId)
  }

  function handleDoubleClick(): void {
    onEdit(cellId)
  }

  return (
    <div
      aria-invalid={error ? true : undefined}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      className={styles.cell}
      data-dependency={isDependency ? true : undefined}
      data-derived={isDerived ? true : undefined}
      data-editing={isEditing ? (isSelected ? 'active' : 'inactive') : undefined}
      id={getCellElementId(cellId)}
      role="gridcell"
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
    >
      <span className={styles.value}>{value}</span>
    </div>
  )
}
