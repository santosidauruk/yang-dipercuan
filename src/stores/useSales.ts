import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Sale } from '@/types'

type SaleInput = Omit<Sale, 'id'>
type SalePatch = Partial<SaleInput>

interface SalesStore {
  sales: Sale[]
  addSale: (input: SaleInput) => Sale
  updateSale: (id: string, patch: SalePatch) => void
  removeSale: (id: string) => void
  removeSalesByCode: (code: string) => void
}

export const useSales = create<SalesStore>()(
  persist(
    (set) => ({
      sales: [],
      addSale: (input) => {
        const created: Sale = { id: crypto.randomUUID(), ...input }
        set((state) => ({ sales: [...state.sales, created] }))
        return created
      },
      updateSale: (id, patch) =>
        set((state) => ({
          sales: state.sales.map((s) => (s.id === id ? { ...s, ...patch } : s))
        })),
      removeSale: (id) =>
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id)
        })),
      removeSalesByCode: (code) =>
        set((state) => ({
          sales: state.sales.filter((s) => s.code !== code)
        }))
    }),
    { name: 'yangdipercuan:sales' }
  )
)
