'use client'

import { usePortfolio } from '@/hooks/usePortfolio'
import { useStocks } from '@/hooks/useStocks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceChange } from '@/components/common/PriceChange'
import { formatCurrency } from '@/lib/utils'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'

export function PortfolioWidget() {
  const { data: holdings, isLoading: holdingsLoading } = usePortfolio()
  const { data: stocks, isLoading: stocksLoading } = useStocks()

  const isLoading = holdingsLoading || stocksLoading

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

  if (!holdings || !stocks) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4" />
            Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No holdings yet.</p>
        </CardContent>
      </Card>
    )
  }

  let totalValue = 0
  let totalCost = 0

  for (const holding of holdings) {
    const stock = stocks.find((s) => s.code === holding.stockCode)
    const currentPrice = stock?.price ?? holding.avgBuyPrice
    totalValue += currentPrice * holding.quantity
    totalCost += holding.avgBuyPrice * holding.quantity
  }

  const totalPnL = totalValue - totalCost
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  return (
    <Link href="/portfolio">
      <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4" />
            Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-bold">
            {formatCurrency(totalValue)}
          </p>
          <PriceChange
            value={totalPnL}
            percentage={totalPnLPercent}
            className="mt-1"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {holdings.length} holdings
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
