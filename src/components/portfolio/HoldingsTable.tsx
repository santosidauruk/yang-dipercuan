'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn, formatNumber, formatPercentage } from '@/lib/utils'
import type { Holding } from '@/lib/portfolio'

export interface HoldingRow extends Holding {
  lastPrice: number | undefined
  marketValue: number
  pct: number | null
  allocationPct: number
}

interface HoldingsTableProps {
  rows: HoldingRow[]
  renderDrillDown?: (code: string) => React.ReactNode
}

export function HoldingsTable({ rows, renderDrillDown }: HoldingsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <div className="border-border/70 bg-card/70 text-muted-foreground rounded-lg border p-8 text-center text-sm">
        <p className="text-foreground font-medium">No holdings yet.</p>
        <p className="mt-1">Add a purchase to see it here.</p>
      </div>
    )
  }

  const sorted = [...rows].sort((a, b) => a.code.localeCompare(b.code))

  return (
    <div className="space-y-2.5">
      {sorted.map((row) => (
        <div key={row.code}>
          <article
            role="row"
            data-testid={`holding-row-${row.code}`}
            tabIndex={renderDrillDown ? 0 : undefined}
            className={cn(
              'border-border/70 bg-card/80 rounded-lg border p-4 shadow-sm shadow-black/5',
              renderDrillDown && 'cursor-pointer'
            )}
            onClick={() =>
              renderDrillDown &&
              setExpanded((cur) => (cur === row.code ? null : row.code))
            }
            onKeyDown={(e) => {
              if (!renderDrillDown) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setExpanded((cur) => (cur === row.code ? null : row.code))
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/stocks/${row.code}`}
                  className="text-xl font-semibold tracking-tight hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.code}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {row.allocationPct.toFixed(2)}% allocation
                </p>
              </div>
              <div
                className={cn(
                  'rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums',
                  row.pct === null && 'text-muted-foreground',
                  row.pct !== null &&
                    row.pct >= 0 &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                  row.pct !== null &&
                    row.pct < 0 &&
                    'border-red-500/30 bg-red-500/10 text-red-500'
                )}
              >
                {row.pct === null ? '-' : formatPercentage(row.pct)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Metric label="Lots" value={row.lots.toString()} />
              <Metric
                label="Average cost"
                value={formatNumber(row.avgCost)}
                right
              />
              <Metric label="Invested" value={formatNumber(row.invested)} />
              <Metric
                label="Market value"
                value={formatNumber(row.marketValue)}
                right
              />
              <Metric
                label="Last price"
                value={
                  row.lastPrice !== undefined
                    ? formatNumber(row.lastPrice)
                    : '-'
                }
              />
            </div>
          </article>
          {renderDrillDown &&
            expanded === row.code &&
            renderDrillDown(row.code)}
        </div>
      ))}
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
