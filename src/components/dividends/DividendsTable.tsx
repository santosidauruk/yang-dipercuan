'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { formatDateDisplay } from '@/lib/date'
import { dividendRow } from '@/lib/portfolio'
import type { Dividend, Purchase, Sale } from '@/types'

interface DividendsTableProps {
  dividends: Dividend[]
  purchases: Purchase[]
  sales: Sale[]
  onDelete: (dividend: Dividend) => void
}

export function DividendsTable({
  dividends,
  purchases,
  sales,
  onDelete
}: DividendsTableProps) {
  if (dividends.length === 0) {
    return (
      <div className="border-border/70 bg-card/70 text-muted-foreground rounded-lg border p-8 text-center text-sm">
        <p className="text-foreground font-medium">No dividend records yet.</p>
        <p className="mt-1">Add your first dividend to track income yield.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {dividends.map((d) => {
        const row = dividendRow(purchases, sales, d)
        const avgCost =
          row.qtyHeld > 0 ? row.purchaseValue / (row.qtyHeld * 100) : 0

        return (
          <article
            key={d.id}
            data-testid={`dividend-row-${d.code}`}
            className="border-border/70 bg-card/80 rounded-lg border p-4 shadow-sm shadow-black/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm">
                  {formatDateDisplay(d.date)}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  {d.code}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {row.qtyHeld} Lot eligible
                </p>
              </div>
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold text-emerald-500 tabular-nums">
                {row.yieldPct > 0 ? formatPercentage(row.yieldPct) : '-'}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Metric
                label="Average cost"
                value={avgCost > 0 ? formatCurrency(avgCost) : '-'}
              />
              <Metric label="DPS" value={formatCurrency(d.dps)} right />
              <Metric
                label="Invested value"
                value={
                  row.purchaseValue > 0
                    ? formatCurrency(row.purchaseValue)
                    : '-'
                }
              />
              <Metric
                label="Total dividend"
                value={formatCurrency(row.totalDividend)}
                right
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="icon-sm"
                className="text-red-500 hover:text-red-500"
                onClick={() => onDelete(d)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function Metric({
  label,
  value,
  right
}: {
  label: string
  value: string
  right?: boolean
}) {
  return (
    <div className={right ? 'text-right' : undefined}>
      <p className="font-medium tabular-nums">{value}</p>
      <p className="text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
