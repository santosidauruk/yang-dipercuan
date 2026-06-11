'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { formatDateDisplay } from '@/lib/date'
import type { Sale } from '@/types'

interface SalesTableProps {
  sales: Sale[]
  onEdit: (sale: Sale) => void
  onDelete: (sale: Sale) => void
}

const SHARES_PER_LOT = 100

export function SalesTable({ sales, onEdit, onDelete }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="border-border/70 bg-card/70 text-muted-foreground rounded-lg border p-8 text-center text-sm">
        <p className="text-foreground font-medium">No sale records yet.</p>
        <p className="mt-1">Add your first sell to track realized gains.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {sales.map((s) => {
        const shares = s.lots * SHARES_PER_LOT
        const purchaseValue = s.costBasis * shares
        const sellValue = s.price * shares
        const capitalGain = (s.price - s.costBasis) * shares
        const pct =
          s.costBasis > 0 ? ((s.price - s.costBasis) / s.costBasis) * 100 : null

        return (
          <article
            key={s.id}
            data-testid={`sale-row-${s.code}`}
            className="border-border/70 bg-card/80 rounded-lg border p-4 shadow-sm shadow-black/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm">
                  {formatDateDisplay(s.date)}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  {s.code}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {s.lots} Lot sold
                </p>
              </div>
              <div
                className={cn(
                  'rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums',
                  pct === null && 'text-muted-foreground',
                  pct !== null &&
                    pct >= 0 &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                  pct !== null &&
                    pct < 0 &&
                    'border-red-500/30 bg-red-500/10 text-red-500'
                )}
              >
                {pct === null ? 'No basis' : formatPercentage(pct)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Metric label="Cost basis" value={formatCurrency(s.costBasis)} />
              <Metric
                label="Sell price"
                value={formatCurrency(s.price)}
                right
              />
              <Metric
                label="Purchase value"
                value={formatCurrency(purchaseValue)}
              />
              <Metric
                label="Sale value"
                value={formatCurrency(sellValue)}
                right
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Realized gain</p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    capitalGain > 0 && 'text-emerald-500',
                    capitalGain < 0 && 'text-red-500'
                  )}
                >
                  {formatCurrency(capitalGain)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onEdit(s)}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="text-red-500 hover:text-red-500"
                  onClick={() => onDelete(s)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
    <div className={cn(right && 'text-right')}>
      <p className="font-medium tabular-nums">{value}</p>
      <p className="text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
