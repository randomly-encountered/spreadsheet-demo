import { useState } from 'react'
import type { PropsWithChildren } from 'react'

import { SpreadsheetStoreContext } from '#/components/Spreadsheet/Spreadsheet.context'
import { createSpreadsheetStore, type SpreadsheetStoreOptions } from '#/spreadsheet/store'

export function SpreadsheetProvider({
  children,
  ...options
}: PropsWithChildren<SpreadsheetStoreOptions>) {
  const [store] = useState(() => createSpreadsheetStore(options))

  return <SpreadsheetStoreContext value={store}>{children}</SpreadsheetStoreContext>
}
