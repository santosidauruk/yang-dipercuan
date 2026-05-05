'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AllocationSlice } from '@/lib/portfolio'

const PALETTE = [
  '#10b981',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#ec4899',
  '#8b5cf6',
  '#22c55e'
]

interface AllocationDonutProps {
  slices: AllocationSlice[]
  mode: 'issuer' | 'sector'
  onModeChange: (mode: 'issuer' | 'sector') => void
}

export function AllocationDonut({
  slices,
  mode,
  onModeChange
}: AllocationDonutProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Allocation</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={mode === 'issuer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('issuer')}
          >
            Issuer
          </Button>
          <Button
            variant={mode === 'sector' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('sector')}
          >
            Sector
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No allocations to display.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={1}
                    isAnimationActive={false}
                  >
                    {slices.map((s, i) => (
                      <Cell key={s.label} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const v = typeof value === 'number' ? value : 0
                      const pct = (item.payload as AllocationSlice).pct
                      const label = (item.payload as AllocationSlice).label
                      return [
                        `${formatCurrency(v)} (${pct.toFixed(1)}%)`,
                        label
                      ]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul
              data-testid="allocation-legend"
              className="space-y-1.5 text-sm"
            >
              {slices.map((s, i) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={cn('inline-block h-3 w-3 rounded-sm')}
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                      aria-hidden
                    />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatCurrency(s.value)} · {s.pct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
