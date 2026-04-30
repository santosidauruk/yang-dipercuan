'use client'

import { TIMEFRAMES } from '@/lib/constants'
import { useStockStore } from '@/stores/useStockStore'
import type { Timeframe } from '@/types'

export function TimeframeSelector() {
  const { selectedTimeframe, setSelectedTimeframe } = useStockStore()

  return (
    <div className="flex gap-1">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.value}
          onClick={() => setSelectedTimeframe(tf.value as Timeframe)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedTimeframe === tf.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  )
}
