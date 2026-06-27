import styles from '#/App.module.css'
import Spreadsheet from '#/components/Spreadsheet'
import SpreadsheetFooter from '#/components/Spreadsheet/SpreadsheetFooter'

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
          <SpreadsheetFooter />
        </figure>
      </section>
    </main>
  )
}

export default App
