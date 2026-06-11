'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStockMeta } from '@/stores/useStockMeta'
import { cn, formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import { formatDateDisplay } from '@/lib/date'
import type { Purchase } from '@/types'

interface PurchasesTableProps {
  purchases: Purchase[]
  prices: Record<string, number | undefined>
  onEdit: (purchase: Purchase) => void
  onDelete: (purchase: Purchase) => void
}

const SHARES_PER_LOT = 100

export function PurchasesTable({
  purchases,
  prices,
  onEdit,
  onDelete
}: PurchasesTableProps) {
  const stockMeta = useStockMeta((s) => s.meta)

  if (purchases.length === 0) {
    return (
      <div className="border-border/70 bg-card/70 text-muted-foreground rounded-lg border p-8 text-center text-sm">
        <p className="text-foreground font-medium">No purchase records yet.</p>
        <p className="mt-1">Add your first buy to start tracking cost basis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {purchases.map((p) => {
        const last = prices[`${p.code}.JK`]
        const invested = p.price * p.lots * SHARES_PER_LOT
        const currentValue =
          last !== undefined ? last * p.lots * SHARES_PER_LOT : null
        const pct =
          last !== undefined && p.price > 0
            ? ((last - p.price) / p.price) * 100
            : null
        const stockName = stockMeta[p.code]?.name ?? p.code

        return (
          <article
            key={p.id}
            data-testid={`purchase-row-${p.code}`}
            className="border-border/70 bg-card/80 rounded-lg border p-4 shadow-sm shadow-black/5"
          >
            <div className="text-muted-foreground text-sm">
              {formatDateDisplay(p.date)}
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {p.code.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-tight">
                    {p.code}
                  </h2>
                  <p className="text-muted-foreground truncate text-sm">
                    {stockName}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'h-fit rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums',
                  pct === null && 'text-muted-foreground',
                  pct !== null &&
                    pct >= 0 &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                  pct !== null &&
                    pct < 0 &&
                    'border-red-500/30 bg-red-500/10 text-red-500'
                )}
              >
                {pct === null ? 'No price' : formatPercentage(pct)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_1.1fr] gap-4">
              <div className="space-y-1">
                <p className="font-medium tabular-nums">{p.lots} Lot</p>
                <p className="text-muted-foreground text-sm tabular-nums">
                  @ {formatNumber(p.price)}
                </p>
                <p className="text-muted-foreground text-sm">Buy</p>
              </div>

              <div className="space-y-1 text-right">
                <p className="font-medium tabular-nums">
                  {formatCurrency(invested)}
                </p>
                <p className="text-muted-foreground text-sm">Buy price</p>
                <p
                  className={cn(
                    'font-medium tabular-nums',
                    pct !== null && pct >= 0 && 'text-emerald-500',
                    pct !== null && pct < 0 && 'text-red-500'
                  )}
                >
                  {currentValue === null
                    ? 'Price unavailable'
                    : formatCurrency(currentValue)}
                </p>
                <p className="text-muted-foreground text-sm">Current value</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onEdit(p)}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="text-red-500 hover:text-red-500"
                onClick={() => onDelete(p)}
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
