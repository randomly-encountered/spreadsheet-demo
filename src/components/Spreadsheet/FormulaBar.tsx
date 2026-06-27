import { Icon } from '@iconify/react'
import { useState } from 'react'
import type { ChangeEvent, KeyboardEvent, RefObject } from 'react'

import styles from '#/components/Spreadsheet/FormulaBar.module.css'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type FormulaInputProps = {
  cellId: string | null
  inputRef: RefObject<HTMLInputElement | null>
  onEditingComplete: () => void
}

type PendingCellEdit = {
  cellId: string | null
  value: string
}

function FormulaInput({ cellId, inputRef, onEditingComplete }: FormulaInputProps) {
  const rawValue = useSpreadsheetStore(state =>
    cellId ? (state.cells.get(cellId)?.raw ?? '') : '',
  )
  const setCell = useSpreadsheetStore(state => state.setCell)
  const [pendingCellEdit, setPendingCellEdit] = useState<PendingCellEdit>({
    cellId,
    value: rawValue,
  })
  // TODO: Surface validation errors with a visible, accessible UI signifier.
  const [error, setError] = useState<string | null>(null)
  const inputValue = pendingCellEdit.cellId === cellId ? pendingCellEdit.value : rawValue

  /*
   * Updates cell state on a valid value change submission. Captures the error to surface to
   * the UI where validation fails.
   */
  function commitPendingCellEdit(): boolean {
    if (cellId === null) return false
    if (inputValue === rawValue) return true

    try {
      setCell(cellId, inputValue)
      setPendingCellEdit({ cellId, value: inputValue })
      setError(null)
      return true
    }
    catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Unable to update cell')
      return false
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setPendingCellEdit({ cellId, value: event.target.value })
    setError(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    // Commit change case
    if (event.key === 'Enter') {
      event.preventDefault()

      if (commitPendingCellEdit()) {
        onEditingComplete()
      }
    }

    // Abandon case
    if (event.key === 'Escape') {
      event.preventDefault()
      setPendingCellEdit({ cellId, value: rawValue })
      setError(null)
      onEditingComplete()
    }
  }

  function handleClear(): void {
    setPendingCellEdit({ cellId, value: '' })
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <div className={styles.inputContainer}>
      <input
        aria-invalid={error ? true : undefined}
        aria-label={cellId ? `Raw value for ${cellId}` : 'Select a cell to edit'}
        className={styles.input}
        disabled={cellId === null}
        placeholder={cellId ? undefined : 'Select a cell'}
        ref={inputRef}
        title={error ?? undefined}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button
        aria-label={cellId ? `Clear input for ${cellId}` : 'Clear input'}
        className={styles.clearButton}
        disabled={cellId === null || inputValue.length === 0}
        type="button"
        onClick={handleClear}
      >
        <Icon aria-hidden="true" icon="ph:x" />
      </button>
    </div>
  )
}

type FormulaBarProps = {
  inputRef: RefObject<HTMLInputElement | null>
  onEditingComplete: () => void
}

export default function FormulaBar({ inputRef, onEditingComplete }: FormulaBarProps) {
  const cellId = useSpreadsheetStore(state => state.selectedCellId)

  return (
    <div className={styles.container}>
      <span className={styles.coordinate}>{cellId ?? ''}</span>
      <span aria-hidden="true" className={styles.symbol}>
        fx
      </span>
      <FormulaInput
        cellId={cellId}
        inputRef={inputRef}
        onEditingComplete={onEditingComplete}
      />
    </div>
  )
}
