'use client'

import { useRealtimeStockDetail } from '@/hooks/useRealtimeStock'
import { useWatchlistStore } from '@/stores/useWatchlistStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { PriceChange } from '../common/PriceChange'
import { Separator } from '../ui/separator'
import { useEffect } from 'react'

export function WatchlistWidget() {
  const { watchlist } = useWatchlistStore()
  useEffect(() => {
    console.log({ watchlist })
  }, [watchlist])
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        {watchlist.length ? (
          <ul>
            {watchlist.map((w, index) => {
              return (
                <>
                  <WatchlistItem code={w} key={w} />
                  {index < watchlist.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </>
              )
            })}
          </ul>
        ) : (
          <div>Add your watchlist</div>
        )}
      </CardContent>
    </Card>
  )
}

const WatchlistItem = ({ code }: { code: string }) => {
  const { data: stock } = useRealtimeStockDetail(code)
  console.log({ stock })

  if (!stock) return
  return (
    <li className="flex items-center justify-between">
      <span className="font-mono font-semibold">
        {stock?.code.replace('.JK', '')}
      </span>
      <div className="flex flex-col items-end">
        <span className="font-mono">{stock.price}</span>
        <PriceChange value={stock.change} percentage={stock.changePercent} />
      </div>
    </li>
  )
}
