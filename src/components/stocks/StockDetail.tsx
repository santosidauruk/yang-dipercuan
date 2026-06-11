'use client'

import type { StockDetail as StockDetailType } from '@/types'
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

function MetricTile({
  id,
  label,
  value,
  hint
}: {
  id: string
  label: string
  value: string | null
  hint?: string
}) {
  return (
    <div
      data-testid={`metric-tile-${id}`}
      className="border-border/70 bg-card/70 rounded-lg border p-3"
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
        {value ?? '-'}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
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

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Key metrics</h2>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile
            id="open"
            label="Open"
            value={formatCurrency(stock.open)}
          />
          <MetricTile
            id="day-range"
            label="Day range"
            value={`${formatCurrency(stock.low)} - ${formatCurrency(
              stock.high
            )}`}
          />
          <MetricTile
            id="prev-close"
            label="Prev close"
            value={formatCurrency(stock.previousClose)}
          />
          <MetricTile
            id="volume"
            label="Volume"
            value={formatCompactNumber(stock.volume)}
          />
          <MetricTile
            id="market-cap"
            label="Market cap"
            value={formatCompactNumber(stock.marketCap)}
          />
          <MetricTile
            id="valuation"
            label="Valuation"
            value={stock.peRatio?.toFixed(2) ?? null}
            hint={`P/B ${stock.pbRatio?.toFixed(2) ?? '-'}`}
          />
          <MetricTile
            id="dividend-yield"
            label="Dividend yield"
            value={
              stock.dividendYield != null
                ? formatPercentage(stock.dividendYield)
                : null
            }
          />
          <MetricTile
            id="eps"
            label="EPS"
            value={stock.eps != null ? formatCurrency(stock.eps) : null}
          />
          <MetricTile
            id="week-52"
            label="52W range"
            value={`${formatCurrency(stock.fiftyTwoWeekLow)} - ${formatCurrency(
              stock.fiftyTwoWeekHigh
            )}`}
          />
        </div>
      </section>
    </div>
  )
}
