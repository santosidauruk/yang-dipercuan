import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistStore {
  watchlist: string[]
  addToWatchlist: (code: string) => void
  removeFromWatchlist: (code: string) => void
  isInWatchlist: (code: string) => boolean
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      watchlist: ['BBCA.JK', 'BBRI.JK', 'TLKM.JK'],
      addToWatchlist: (code) =>
        set((state) => ({
          watchlist: state.watchlist.includes(code)
            ? state.watchlist
            : [...state.watchlist, code]
        })),
      removeFromWatchlist: (code) =>
        set((state) => ({
          watchlist: state.watchlist.filter((c) => c !== code)
        })),
      isInWatchlist: (code) => get().watchlist.includes(code)
    }),
    { name: 'stockidx-watchlist' }
  )
)
