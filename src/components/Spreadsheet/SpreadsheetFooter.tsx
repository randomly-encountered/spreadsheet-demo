import { Icon } from '@iconify/react'

import styles from '#/components/Spreadsheet/SpreadsheetFooter.module.css'

export function SpreadsheetFooter() {
  return (
    <figcaption className={styles.footer}>
      Use
      <span
        aria-label="arrow keys"
        className={`${styles.keyIcon} ${styles.arrowKeys}`}
        role="img"
      >
        <Icon aria-hidden="true" icon="mdi:arrow-left" />
        <Icon aria-hidden="true" icon="mdi:arrow-up" />
        <Icon aria-hidden="true" icon="mdi:arrow-down" />
        <Icon aria-hidden="true" icon="mdi:arrow-right" />
      </span>
      to move between cells. Press
      <span aria-label="Enter key" className={styles.keyIcon} role="img">
        <Icon aria-hidden="true" icon="mdi:keyboard-return" />
      </span>
      to edit the selected cell.
    </figcaption>
  )
}
