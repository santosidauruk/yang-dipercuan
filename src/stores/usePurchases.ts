import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Purchase } from '@/types'

type PurchaseInput = Omit<Purchase, 'id'>
type PurchasePatch = Partial<PurchaseInput>

interface PurchasesStore {
  purchases: Purchase[]
  addPurchase: (input: PurchaseInput) => Purchase
  updatePurchase: (id: string, patch: PurchasePatch) => void
  removePurchase: (id: string) => void
}

export const usePurchases = create<PurchasesStore>()(
  persist(
    (set) => ({
      purchases: [],
      addPurchase: (input) => {
        const created: Purchase = { id: crypto.randomUUID(), ...input }
        set((state) => ({ purchases: [...state.purchases, created] }))
        return created
      },
      updatePurchase: (id, patch) =>
        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          )
        })),
      removePurchase: (id) =>
        set((state) => ({
          purchases: state.purchases.filter((p) => p.id !== id)
        }))
    }),
    { name: 'granary:purchases' }
  )
)
