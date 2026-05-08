'use client'

import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchApi } from '@/lib/api'
import { IHSG_CODE } from '@/lib/constants'
import { todayISO } from '@/lib/date'
import { holdings as buildHoldings } from '@/lib/portfolio'
import {
  computeBenchmarkSeries,
  computeTwrSeries,
  resolveWindow,
  type PerformanceWindow,
  type PriceSample
} from '@/lib/twr'
import type { OHLCV, Purchase, Sale } from '@/types'

const WINDOWS: PerformanceWindow[] = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL']

function rangeFor(win: PerformanceWindow): string {
  switch (win) {
    case '1M':
      return '1mo'
    case '3M':
      return '3mo'
    case '6M':
      return '6mo'
    case 'YTD':
      return 'ytd'
    case '1Y':
      return '1y'
    case 'ALL':
      return 'max'
  }
}

function ohlcvToSamples(data: OHLCV[] | undefined): PriceSample[] {
  if (!Array.isArray(data)) return []
  return data.map((d) => ({
    date: new Date(d.time * 1000).toISOString().slice(0, 10),
    close: d.close
  }))
}

interface Props {
  purchases: Purchase[]
  sales: Sale[]
}

export function PerformanceChart({ purchases, sales }: Props) {
  const [win, setWin] = useState<PerformanceWindow>('1Y')

  const heldCodes = useMemo(
    () => buildHoldings(purchases, sales).map((h) => h.code),
    [purchases, sales]
  )

  const enabled = purchases.length > 0
  const range = rangeFor(win)

  const ihsgQuery = useQuery<OHLCV[]>({
    queryKey: ['stock-history', IHSG_CODE, '1d', range],
    queryFn: () =>
      fetchApi<OHLCV[]>(
        `/api/stocks/${encodeURIComponent(IHSG_CODE)}/history?interval=1d&range=${range}`
      ),
    enabled
  })

  const heldQueries = useQueries({
    queries: (enabled ? heldCodes : []).map((code) => ({
      queryKey: ['stock-history', code, '1d', range],
      queryFn: () =>
        fetchApi<OHLCV[]>(
          `/api/stocks/${encodeURIComponent(code)}/history?interval=1d&range=${range}`
        ),
      enabled
    }))
  })

  const isLoading =
    ihsgQuery.isLoading || heldQueries.some((q) => q.isLoading)

  const firstPurchaseDate = useMemo(() => {
    if (purchases.length === 0) return undefined
    return purchases.reduce(
      (min, p) => (p.date < min ? p.date : min),
      purchases[0].date
    )
  }, [purchases])

  const today = todayISO()
  const { start } = resolveWindow(win, firstPurchaseDate, today)

  const ihsgSeries = useMemo(
    () => ohlcvToSamples(ihsgQuery.data),
    [ihsgQuery.data]
  )

  const priceSeriesByCode = useMemo<Record<string, PriceSample[]>>(() => {
    const out: Record<string, PriceSample[]> = {}
    for (let i = 0; i < heldCodes.length; i++) {
      out[heldCodes[i]] = ohlcvToSamples(heldQueries[i]?.data)
    }
    return out
  }, [heldQueries, heldCodes])

  const portfolioSeries = useMemo(
    () =>
      computeTwrSeries({
        purchases,
        sales,
        priceSeriesByCode,
        start,
        end: today
      }),
    [purchases, sales, priceSeriesByCode, start, today]
  )

  const benchmarkSeries = useMemo(
    () => computeBenchmarkSeries(ihsgSeries, start, today),
    [ihsgSeries, start, today]
  )

  const chartData = useMemo(() => {
    const map = new Map<
      string,
      { date: string; portfolio?: number; ihsg?: number }
    >()
    for (const p of portfolioSeries) {
      map.set(p.date, { date: p.date, portfolio: p.index })
    }
    for (const b of benchmarkSeries) {
      const prev = map.get(b.date) ?? { date: b.date }
      map.set(b.date, { ...prev, ihsg: b.index })
    }
    const out = Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    console.log({ chartData: out })
    return out
  }, [portfolioSeries, benchmarkSeries])

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center text-sm">
            Add a purchase to see performance.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Performance</CardTitle>
        <div className="flex flex-wrap gap-1">
          {WINDOWS.map((w) => (
            <Button
              key={w}
              size="sm"
              variant={w === win ? 'default' : 'outline'}
              aria-pressed={w === win}
              onClick={() => setWin(w)}
            >
              {w}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : (
          <div className="h-[280px] w-full" data-testid="performance-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={32} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(v: number) => v.toFixed(0)}
                />
                <Tooltip
                  formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : '')}
                  labelStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  name="Portfolio"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="ihsg"
                  name="IHSG"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
