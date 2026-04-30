import { create } from 'zustand'
import type { Timeframe } from '@/types'

interface StockStore {
  selectedTimeframe: Timeframe
  setSelectedTimeframe: (timeframe: Timeframe) => void
}

export const useStockStore = create<StockStore>((set) => ({
  selectedTimeframe: '1D',
  setSelectedTimeframe: (timeframe) => set({ selectedTimeframe: timeframe })
}))
