import { Icon } from '@iconify/react'

import styles from '#/App.module.css'
import Spreadsheet from '#/components/Spreadsheet'

function App() {
  return (
    <main className={styles.shell}>
      <section aria-labelledby="workspace-title" className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Formula Engine</p>
            <h1 id="workspace-title">Spreadsheet Demo</h1>
          </div>
        </header>
        <figure className={styles.spreadsheetFigure}>
          <Spreadsheet />
          <figcaption className={styles.hint}>
            Use
            <span aria-label="arrow keys" className={styles.arrowKeys} role="img">
              <Icon aria-hidden="true" icon="ph:arrow-square-left-light" />
              <Icon aria-hidden="true" icon="ph:arrow-square-up-light" />
              <Icon aria-hidden="true" icon="ph:arrow-square-down-light" />
              <Icon aria-hidden="true" icon="ph:arrow-square-right-light" />
            </span>
            to move between cells.
          </figcaption>
        </figure>
      </section>
    </main>
  )
}

export default App
