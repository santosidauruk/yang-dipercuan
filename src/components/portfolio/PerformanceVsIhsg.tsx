'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { usePortfolioHistory } from '@/hooks/usePortfolio'
import { useStockHistory } from '@/hooks/useStocks'
import { IHSG_CODE } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartPoint {
  date: string
  portfolio: number
  ihsg: number
}

export function PerformanceVsIhsg() {
  const { data: historyData, isLoading: histLoading } = usePortfolioHistory()
  const { data: ihsgData, isLoading: ihsgLoading } = useStockHistory(
    IHSG_CODE,
    '1d',
    '6mo'
  )

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!historyData?.length || !ihsgData?.length) return []

    // Build IHSG map: date → close
    const ihsgMap = new Map<string, number>()
    for (const candle of ihsgData) {
      const date = new Date(candle.time * 1000).toISOString().slice(0, 10)
      ihsgMap.set(date, candle.close)
    }

    // Normalize both series to % change from their first data point
    const portBase = historyData[0].value
    const ihsgBase = ihsgData[0].close

    const points: ChartPoint[] = []
    for (const { date, value } of historyData) {
      const ihsgClose = ihsgMap.get(date)
      if (ihsgClose === undefined) continue

      points.push({
        date,
        portfolio: ((value - portBase) / portBase) * 100,
        ihsg: ((ihsgClose - ihsgBase) / ihsgBase) * 100
      })
    }
    return points
  }, [historyData, ihsgData])

  const alpha = useMemo(() => {
    if (!chartData.length) return null
    const last = chartData[chartData.length - 1]
    return last.portfolio - last.ihsg
  }, [chartData])

  const isLoading = histLoading || ihsgLoading

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>vs IHSG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-65 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>vs IHSG</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            No data available.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>vs IHSG (6mo)</span>
          {alpha !== null && (
            <span
              className={`text-sm font-normal ${alpha > 0 ? 'text-green-500' : alpha < 0 ? 'text-red-500' : ''}`}
            >
              Alpha: {alpha > 0 ? '+' : ''}
              {alpha.toFixed(2)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => d.slice(5)}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              tick={{ fontSize: 11 }}
              width={50}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                value !== undefined ? `${value.toFixed(2)}%` : 'N/A',
                name === 'portfolio' ? 'Portfolio' : 'IHSG'
              ]}
              labelFormatter={(label) => label}
            />
            <Legend
              formatter={(value) =>
                value === 'portfolio' ? 'Portfolio' : 'IHSG'
              }
            />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#2563eb"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="ihsg"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
