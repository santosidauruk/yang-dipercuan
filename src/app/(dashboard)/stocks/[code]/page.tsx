'use client'

import { use } from 'react'
import { useStockDetail, useStockHistory } from '@/hooks/useStocks'
import { useStockStore } from '@/stores/useStockStore'
import { TIMEFRAMES } from '@/lib/constants'
import { StockDetailCard } from '@/components/stocks/StockDetail'
import { TimeframeSelector } from '@/components/stocks/TimeframeSelector'
import { WatchlistButton } from '@/components/stocks/WatchlistButton'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Uncomment once you build CandlestickChart:
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { useRealtimeStockDetail } from '@/hooks/useRealtimeStock'

export default function StockDetailPage({
  params
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const symbol = code.toUpperCase().endsWith('.JK')
    ? code.toUpperCase()
    : `${code.toUpperCase()}.JK`

  const { selectedTimeframe } = useStockStore()
  const timeframeConfig = TIMEFRAMES.find(
    (tf) => tf.value === selectedTimeframe
  )

  const {
    data: stock,
    isLoading: stockLoading,
    isRefetching: stockIsRefetching
  } = useRealtimeStockDetail(symbol, {
    refetchInterval: 5_000
  })
  const { data: history, isLoading: historyLoading } = useStockHistory(
    symbol,
    timeframeConfig?.interval ?? '1d',
    timeframeConfig?.range ?? '6mo'
  )

  return (
    <div className="space-y-4">
      {/* Back + Watchlist */}
      <div className="flex items-center justify-between">
        <Link
          href="/stocks"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stocks
        </Link>
        <WatchlistButton stockCode={symbol} />
      </div>

      {/* Stock Info */}
      {stockLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-60" />
        </div>
      ) : stock ? (
        <StockDetailCard stock={stock} isRefetching={stockIsRefetching} />
      ) : (
        <div className="text-muted-foreground py-8 text-center">
          Stock not found.
        </div>
      )}

      {/* Chart Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Chart</h2>
          <TimeframeSelector />
        </div>

        {historyLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : history && history.length > 0 ? (
          <CandlestickChart data={history} />
        ) : (
          // <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
          //   <div className="text-center">
          //     <p className="font-medium">CandlestickChart placeholder</p>
          //     <p className="text-xs mt-1">
          //       {history.length} data points loaded — build
          //       CandlestickChart.tsx to render them
          //     </p>
          //   </div>
          // </div>
          <div className="text-muted-foreground flex h-[400px] items-center justify-center rounded-md border">
            No chart data available.
          </div>
        )}
      </div>
    </div>
  )
}
