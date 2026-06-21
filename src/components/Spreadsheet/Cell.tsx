import { useEffect, useRef } from 'react'
import type { KeyboardEventHandler } from 'react'

import styles from '#/components/Spreadsheet/Cell.module.css'

type CellProps = {
  cellId: string
  isSelected: boolean
  value: number | string
  onKeyDown: KeyboardEventHandler<HTMLDivElement>
  onSelect: () => void
}

function Cell({ cellId, isSelected, value, onKeyDown, onSelect }: CellProps) {
  const cellRef = useRef<HTMLDivElement>(null)

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
      onFocus={isSelected ? undefined : onSelect}
      onKeyDown={onKeyDown}
    >
      {value}
    </div>
  )
}

export default Cell
