import { Icon } from '@iconify/react'
import { useId, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, RefObject } from 'react'

import styles from '#/components/Spreadsheet/FormulaInput.module.css'
import { useSpreadsheetStore } from '#/components/Spreadsheet/Spreadsheet.context'

type FormulaInputProps = {
  cellId: string | null
  ref: RefObject<HTMLInputElement | null>
  onConfirm: () => void
}

type PendingEdit = {
  cellId: string | null
  value: string
}

export function FormulaInput({ cellId, ref, onConfirm }: FormulaInputProps) {
  const setCell = useSpreadsheetStore(state => state.setCell)
  const rawValue = useSpreadsheetStore(state =>
    cellId ? (state.cells.get(cellId)?.raw ?? '') : '',
  )

  const errorId = useId()
  const [error, setError] = useState<string | null>(null)
  const [pendingEdit, setPendingEdit] = useState<PendingEdit>({ cellId, value: rawValue })

  const displayValue = pendingEdit.cellId === cellId ? pendingEdit.value : rawValue
  const hasPendingChange = displayValue !== rawValue

  /*
   * Updates cell state on a valid value change submission. Captures any error to surface to
   * the UI where validation fails.
   */
  function commitPendingEdit(): boolean {
    if (cellId === null) return false
    if (displayValue === rawValue) return true

    try {
      const committedValue = setCell(cellId, displayValue)
      setPendingEdit({ cellId, value: committedValue })
      setError(null)
      return true
    }
    catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Unable to update cell')
      return false
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setPendingEdit({ cellId, value: event.target.value })
    setError(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    // Commit change case
    if (event.key === 'Enter') {
      event.preventDefault()
      handleConfirm()
    }

    // Abandon case
    if (event.key === 'Escape') {
      event.preventDefault()
      handleCancel()
    }
  }

  function handleCancel(): void {
    setPendingEdit({ cellId, value: rawValue })
    setError(null)
    onConfirm()
  }

  function handleClear(): void {
    setPendingEdit({ cellId, value: '' })
    setError(null)
    ref.current?.focus()
  }

  function handleConfirm(): void {
    if (commitPendingEdit()) {
      onConfirm()
      return
    }

    ref.current?.focus()
  }

  return (
    <>
      <div className={styles.inputContainer}>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          aria-label={cellId ? `Raw value for ${cellId}` : 'Select a cell to edit'}
          className={styles.input}
          disabled={cellId === null}
          placeholder={cellId ? undefined : 'Select a cell'}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {cellId && (
          <div className={styles.inputActions}>
            {displayValue.length > 0 && (
              <button
                aria-label={`Clear input for ${cellId}`}
                className={styles.inputAction}
                type="button"
                onClick={handleClear}
              >
                <Icon aria-hidden="true" className={styles.actionIcon} icon="mdi:eraser" />
                <span>Clear</span>
              </button>
            )}
            <button
              aria-label={`Cancel edit for ${cellId}`}
              className={styles.inputAction}
              type="button"
              onClick={handleCancel}
            >
              <Icon aria-hidden="true" className={styles.actionIcon} icon="mdi:keyboard-esc" />
              <span>Cancel</span>
            </button>
            {hasPendingChange && (
              <button
                aria-label={`Confirm edit for ${cellId}`}
                className={`${styles.inputAction} ${styles.confirmAction}`}
                disabled={Boolean(error)}
                type="button"
                onClick={handleConfirm}
              >
                <Icon
                  aria-hidden="true"
                  className={styles.actionIcon}
                  icon="mdi:keyboard-return"
                />
                <span>Confirm</span>
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className={styles.errorBanner} id={errorId} role="alert">
          {error}
        </div>
      )}
    </>
  )
}
