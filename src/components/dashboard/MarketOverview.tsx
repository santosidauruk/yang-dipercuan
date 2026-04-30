'use client'

import { useStockDetail } from '@/hooks/useStocks'
import { IHSG_CODE } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceChange } from '@/components/common/PriceChange'
import { formatNumber } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export function MarketOverview() {
  const { data: ihsg, isLoading } = useStockDetail(IHSG_CODE)

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  if (!ihsg) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            IHSG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Market data unavailable.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          IHSG
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-2xl font-bold">
          {formatNumber(ihsg.price)}
        </p>
        <PriceChange
          value={ihsg.change}
          percentage={ihsg.changePercent}
          className="mt-1"
        />
      </CardContent>
    </Card>
  )
}
