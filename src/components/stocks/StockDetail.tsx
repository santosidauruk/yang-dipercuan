'use client'

import type { StockDetail as StockDetailType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PriceChange } from '@/components/common/PriceChange'
import {
  formatCurrency,
  formatCompactNumber,
  formatPercentage
} from '@/lib/utils'
import { Spinner } from '../ui/spinner'

interface StockDetailProps {
  stock: StockDetailType
  isRefetching: boolean
}

function MetricRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value ?? '—'}</span>
    </div>
  )
}

export function StockDetailCard({ stock, isRefetching }: StockDetailProps) {
  return (
    <div className="space-y-4">
      {/* Price Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-2xl font-bold">
            {stock.code.replace('.JK', '')}
          </h1>
          <Badge variant="secondary">{stock.sector}</Badge>
          {isRefetching && <Spinner />}
        </div>
        <p className="text-muted-foreground text-sm">{stock.name}</p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="font-mono text-3xl font-bold">
            {formatCurrency(stock.price)}
          </span>
          <PriceChange value={stock.change} percentage={stock.changePercent} />
        </div>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <MetricRow label="Open" value={formatCurrency(stock.open)} />
          <MetricRow label="High" value={formatCurrency(stock.high)} />
          <MetricRow label="Low" value={formatCurrency(stock.low)} />
          <MetricRow
            label="Prev Close"
            value={formatCurrency(stock.previousClose)}
          />
          <MetricRow label="Volume" value={formatCompactNumber(stock.volume)} />
          <MetricRow
            label="Market Cap"
            value={formatCompactNumber(stock.marketCap)}
          />
          <MetricRow
            label="P/E Ratio"
            value={stock.peRatio?.toFixed(2) ?? null}
          />
          <MetricRow
            label="P/B Ratio"
            value={stock.pbRatio?.toFixed(2) ?? null}
          />
          <MetricRow
            label="Dividend Yield"
            value={
              stock.dividendYield != null
                ? formatPercentage(stock.dividendYield)
                : null
            }
          />
          <MetricRow
            label="EPS"
            value={stock.eps != null ? formatCurrency(stock.eps) : null}
          />
          <MetricRow
            label="52W High"
            value={formatCurrency(stock.fiftyTwoWeekHigh)}
          />
          <MetricRow
            label="52W Low"
            value={formatCurrency(stock.fiftyTwoWeekLow)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
