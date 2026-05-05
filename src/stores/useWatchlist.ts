import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WatchlistItem } from '@/types'

interface WatchlistStore {
  items: WatchlistItem[]
  addItem: (code: string) => void
  removeItem: (code: string) => void
  has: (code: string) => boolean
}

export const useWatchlist = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (code) =>
        set((state) =>
          state.items.some((i) => i.code === code)
            ? state
            : { items: [...state.items, { code, addedAt: new Date().toISOString() }] }
        ),
      removeItem: (code) =>
        set((state) => ({
          items: state.items.filter((i) => i.code !== code)
        })),
      has: (code) => get().items.some((i) => i.code === code)
    }),
    { name: 'yangdipercuan:watchlist' }
  )
)
