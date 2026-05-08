'use client'

import { useEffect } from 'react'
import { useStockHistory } from '@/hooks/useStocks'
import { useRealtimeStockDetail } from '@/hooks/useRealtimeStock'
import { useStockStore } from '@/stores/useStockStore'
import { useStockMeta } from '@/stores/useStockMeta'
import { TIMEFRAMES } from '@/lib/constants'
import { fetchStockProfile } from '@/lib/stock-meta'
import { StockDetailCard } from '@/components/stocks/StockDetail'
import { TimeframeSelector } from '@/components/stocks/TimeframeSelector'
import { WatchlistButton } from '@/components/stocks/WatchlistButton'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const bareCode = (code: string) => code.replace(/\.JK$/i, '').toUpperCase()

interface Props {
  code: string
}

export function StockDetailPageClient({ code }: Props) {
  const bare = bareCode(code)
  const symbol = `${bare}.JK`

  const { selectedTimeframe } = useStockStore()
  const timeframeConfig = TIMEFRAMES.find(
    (tf) => tf.value === selectedTimeframe
  )

  const cachedMeta = useStockMeta((s) => s.meta[bare])
  const setMeta = useStockMeta((s) => s.setMeta)

  useEffect(() => {
    if (cachedMeta) return
    fetchStockProfile(bare)
      .then((m) => setMeta(bare, m))
      .catch(() => setMeta(bare, { name: bare, sector: 'Unknown' }))
  }, [bare, cachedMeta, setMeta])

  const {
    data: stock,
    isLoading: stockLoading,
    isRefetching: stockIsRefetching
  } = useRealtimeStockDetail(symbol, { refetchInterval: 5_000 })

  const { data: history, isLoading: historyLoading } = useStockHistory(
    symbol,
    timeframeConfig?.interval ?? '1d',
    timeframeConfig?.range ?? '6mo'
  )

  const displayed = stock
    ? {
        ...stock,
        name: cachedMeta?.name ?? stock.name,
        sector: cachedMeta?.sector ?? 'Unknown'
      }
    : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/portfolio"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <WatchlistButton stockCode={symbol} />
      </div>

      {stockLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-60" />
        </div>
      ) : displayed ? (
        <StockDetailCard stock={displayed} isRefetching={stockIsRefetching} />
      ) : (
        <div className="text-muted-foreground py-8 text-center">
          Stock not found.
        </div>
      )}

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
          <div className="text-muted-foreground flex h-[400px] items-center justify-center rounded-md border">
            No chart data available.
          </div>
        )}
      </div>
    </div>
  )
}
