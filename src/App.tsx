import styles from '#/App.module.css'
import Spreadsheet from '#/components/Spreadsheet'

function App() {
  return (
    <main className={styles.shell}>
      <section aria-labelledby="workspace-title" className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Spreadsheet</p>
            <h1 id="workspace-title">Formula workspace</h1>
          </div>
          <p className={styles.hint}>Use the arrow keys to move between cells.</p>
        </header>

        <Spreadsheet />
      </section>
    </main>
  )
}

export default App
