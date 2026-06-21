import { createContext, useContext } from 'react'
import { useStore } from 'zustand'

import {
  type SpreadsheetState,
  type SpreadsheetStore
} from '#/spreadsheet/store'

export const SpreadsheetStoreContext = createContext<SpreadsheetStore | null>(null)

export function useSpreadsheetStore<T>(selector: (state: SpreadsheetState) => T): T {
  const store = useContext(SpreadsheetStoreContext)

  if (!store) throw new Error('useSpreadsheetStore must be used within SpreadsheetProvider')

  return useStore(store, selector)
}
