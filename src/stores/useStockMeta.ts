import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StockMeta {
  name: string
  sector: string
}

interface StockMetaStore {
  meta: Record<string, StockMeta>
  setMeta: (code: string, meta: StockMeta) => void
}

export const useStockMeta = create<StockMetaStore>()(
  persist(
    (set) => ({
      meta: {},
      setMeta: (code, meta) =>
        set((state) => ({ meta: { ...state.meta, [code]: meta } }))
    }),
    { name: 'granary:stockMeta' }
  )
)
