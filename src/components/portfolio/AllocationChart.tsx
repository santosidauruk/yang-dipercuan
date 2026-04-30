'use client'

import { useMemo } from 'react'
import { PieChart, Pie, ResponsiveContainer } from 'recharts'
import { HoldingWithMarket } from '@/types'
import { CHART_COLORS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '../ui/spinner'

interface Props {
  holdings: HoldingWithMarket[]
  isLoading?: boolean
}

export function AllocationChart({ holdings, isLoading }: Props) {
  const data = useMemo(() => {
    const totalValue = holdings.reduce((acc, h) => acc + h.currentValue, 0)
    const bySector = new Map<string, number>()
    for (const h of holdings) {
      bySector.set(h.sector, (bySector.get(h.sector) ?? 0) + h.currentValue)
    }
    return Array.from(bySector.entries()).map(([name, value], i) => ({
      name,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }))
  }, [holdings])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allocation by Sector</CardTitle>
        </CardHeader>
        <CardContent>
          <Spinner className='mx-auto h-32'/>
        </CardContent>
      </Card>
    )
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allocation by Sector</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            No holdings to display.
          </p>
        </CardContent>
      </Card>
    )
  }
  console.log('AllocationChart data:', data)
  console.log('AllocationChart holdings:', holdings)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation by Sector</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              labelLine={false}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 space-y-1.5">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center text-sm">
              <div
                className="mr-2 h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="truncate">{entry.name}</span>
              <span className="text-muted-foreground ml-2 truncate">
                {formatCurrency(entry.value)}
              </span>
              <span className="ml-auto shrink-0">
                {`${entry.percentage.toFixed(2)}%`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
