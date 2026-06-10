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
      <CardContent className="grid gap-4 grid-cols-2">
        <Stat label="Total Invested" value={formatCurrency(summary.totalInvested)} />
        <Stat
          label="Total Current Value"
          value={formatCurrency(summary.totalCurrentValue)}
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
        />
        <Stat label="Realized Gain" value={formatCurrency(summary.realizedGain)} />
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
  testId
}: {
  label: string
  value: React.ReactNode
  testId?: string
}) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </div>
      <div className="text-lg font-semibold" data-testid={testId}>
        {value}
      </div>
    </div>
  )
}
