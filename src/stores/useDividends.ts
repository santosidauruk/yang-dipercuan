import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dividend } from '@/types'

type DividendInput = Omit<Dividend, 'id'>

interface DividendsStore {
  dividends: Dividend[]
  addDividend: (input: DividendInput) => Dividend
  removeDividend: (id: string) => void
  removeDividendsByCode: (code: string) => void
}

export const useDividends = create<DividendsStore>()(
  persist(
    (set) => ({
      dividends: [],
      addDividend: (input) => {
        const created: Dividend = { id: crypto.randomUUID(), ...input }
        set((state) => ({ dividends: [...state.dividends, created] }))
        return created
      },
      removeDividend: (id) =>
        set((state) => ({
          dividends: state.dividends.filter((d) => d.id !== id)
        })),
      removeDividendsByCode: (code) =>
        set((state) => ({
          dividends: state.dividends.filter((d) => d.code !== code)
        }))
    }),
    { name: 'yangdipercuan:dividends' }
  )
)
