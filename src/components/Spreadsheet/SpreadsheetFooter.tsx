import { Icon } from '@iconify/react'

import styles from '#/components/Spreadsheet/SpreadsheetFooter.module.css'

function SpreadsheetFooter() {
  return (
    <figcaption className={styles.footer}>
      Use
      <span
        aria-label="arrow keys"
        className={`${styles.keyIcon} ${styles.arrowKeys}`}
        role="img"
      >
        <Icon aria-hidden="true" icon="ph:arrow-square-left-light" />
        <Icon aria-hidden="true" icon="ph:arrow-square-up-light" />
        <Icon aria-hidden="true" icon="ph:arrow-square-down-light" />
        <Icon aria-hidden="true" icon="ph:arrow-square-right-light" />
      </span>
      to move between cells. Press
      <span aria-label="Enter key" className={styles.keyIcon} role="img">
        <Icon aria-hidden="true" icon="ph:key-return-light" />
      </span>
      to edit the selected cell.
    </figcaption>
  )
}

export default SpreadsheetFooter
