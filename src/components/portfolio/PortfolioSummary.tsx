'use client'

import { HoldingWithMarket } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { UnrealizedPnL } from './UnrealizedPnL'

interface Props {
  portfolio: HoldingWithMarket[]
}

export function PortfolioSummary({ portfolio }: Props) {
  const totalCost = portfolio.reduce((acc, curr) => acc + curr.totalCost, 0)
  const totalValue = portfolio.reduce((acc, curr) => acc + curr.currentValue, 0)
  const totalPnL = totalValue - totalCost
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Total Value</p>
            <p className="text-lg font-semibold">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Total Cost</p>
            <p className="text-lg font-semibold">{formatCurrency(totalCost)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Unrealized P&L</p>
            <UnrealizedPnL value={totalPnL} percent={totalPnLPercent} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Holdings</p>
            <p className="text-lg font-semibold">{portfolio.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
