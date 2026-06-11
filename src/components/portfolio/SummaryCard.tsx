'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import type { PortfolioSummary } from '@/lib/portfolio'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  summary: PortfolioSummary
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const netPct =
    summary.totalInvested > 0
      ? (summary.netCapitalChange / summary.totalInvested) * 100
      : 0
  const netColor =
    summary.netCapitalChange > 0
      ? 'text-emerald-500'
      : summary.netCapitalChange < 0
        ? 'text-red-500'
        : 'text-foreground'

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4">
        <Stat
          label="Total Market Value"
          value={formatCurrency(summary.totalCurrentValue)}
          primary
        />
        <Stat
          label="Net Capital Change"
          testId="summary-net-capital-change"
          value={
            <div className={cn('flex flex-col', netColor)}>
              <span>{formatCurrency(summary.netCapitalChange)}</span>
              <span className="text-xs">{formatPercentage(netPct)}</span>
            </div>
          }
          primary
        />
        <Stat
          label="Total Invested"
          value={formatCurrency(summary.totalInvested)}
        />
        <Stat
          label="Realized Gain"
          value={formatCurrency(summary.realizedGain)}
        />
        <Stat
          label="Total Dividends"
          value={formatCurrency(summary.totalDividends)}
        />
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  testId,
  primary = false
}: {
  label: string
  value: React.ReactNode
  testId?: string
  primary?: boolean
}) {
  return (
    <div className={cn('space-y-1', primary && 'col-span-2')}>
      <div className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </div>
      <div
        className={cn(
          'font-semibold tabular-nums',
          primary ? 'text-2xl' : 'text-lg'
        )}
        data-testid={testId}
      >
        {value}
      </div>
    </div>
  )
}
