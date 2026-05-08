import { format, parseISO, subMonths, subYears, startOfYear } from 'date-fns'
import type { Purchase, Sale } from '@/types'

const SHARES_PER_LOT = 100

export type PerformanceWindow = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL'

export interface PriceSample {
  date: string
  close: number
}

export interface SeriesPoint {
  date: string
  index: number
}

export interface TwrInput {
  purchases: Purchase[]
  sales: Sale[]
  priceSeriesByCode: Record<string, PriceSample[]>
  start: string
  end: string
}

export interface ResolvedWindow {
  start: string
}

export function resolveWindow(
  win: PerformanceWindow,
  firstPurchaseDate: string | undefined,
  todayISO: string
): ResolvedWindow {
  const today = parseISO(todayISO)
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (win) {
    case '1M':
      return { start: fmt(subMonths(today, 1)) }
    case '3M':
      return { start: fmt(subMonths(today, 3)) }
    case '6M':
      return { start: fmt(subMonths(today, 6)) }
    case '1Y':
      return { start: fmt(subYears(today, 1)) }
    case 'YTD':
      return { start: fmt(startOfYear(today)) }
    case 'ALL':
      return { start: firstPurchaseDate ?? todayISO }
  }
}

function unionSortedDates(seriesByCode: Record<string, PriceSample[]>): string[] {
  const set = new Set<string>()
  for (const series of Object.values(seriesByCode)) {
    for (const s of series) set.add(s.date)
  }
  return Array.from(set).sort()
}

function forwardFill(
  series: PriceSample[],
  dates: string[]
): Record<string, number | undefined> {
  const byDate = new Map(series.map((s) => [s.date, s.close]))
  const out: Record<string, number | undefined> = {}
  let last: number | undefined
  for (const d of dates) {
    const v = byDate.get(d)
    if (v !== undefined) last = v
    out[d] = last
  }
  return out
}

export function computeTwrSeries(input: TwrInput): SeriesPoint[] {
  const { purchases, sales, priceSeriesByCode, start, end } = input
  if (purchases.length === 0) return []

  const codes = Object.keys(priceSeriesByCode)
  if (codes.length === 0) return []

  const allDates = unionSortedDates(priceSeriesByCode)
  if (allDates.length === 0) return []

  const filledByCode: Record<string, Record<string, number | undefined>> = {}
  for (const code of codes) {
    filledByCode[code] = forwardFill(priceSeriesByCode[code], allDates)
  }

  const sharesEod = (code: string, date: string): number => {
    const buyLots = purchases
      .filter((p) => p.code === code && p.date <= date)
      .reduce((s, p) => s + p.lots, 0)
    const sellLots = sales
      .filter((s) => s.code === code && s.date <= date)
      .reduce((s, x) => s + x.lots, 0)
    return (buyLots - sellLots) * SHARES_PER_LOT
  }

  const cashflow = (date: string): number => {
    const buys = purchases
      .filter((p) => p.date === date)
      .reduce((s, p) => s + p.lots * SHARES_PER_LOT * p.price, 0)
    const sells = sales
      .filter((s) => s.date === date)
      .reduce((s, x) => s + x.lots * SHARES_PER_LOT * x.price, 0)
    return buys - sells
  }

  const portfolioValue = (date: string): number => {
    let v = 0
    for (const code of codes) {
      const shares = sharesEod(code, date)
      if (shares === 0) continue
      const px = filledByCode[code][date]
      if (px === undefined) continue
      v += shares * px
    }
    return v
  }

  const windowDates = allDates.filter((d) => d >= start && d <= end)
  if (windowDates.length === 0) return []

  const out: SeriesPoint[] = []
  let idx = 100
  let prevV = portfolioValue(windowDates[0])
  out.push({ date: windowDates[0], index: idx })

  for (let i = 1; i < windowDates.length; i++) {
    const d = windowDates[i]
    const v = portfolioValue(d)
    const cf = cashflow(d)
    if (prevV > 0) {
      const r = (v - prevV - cf) / prevV
      idx = idx * (1 + r)
    }
    out.push({ date: d, index: idx })
    prevV = v
  }

  return out
}

export function computeBenchmarkSeries(
  series: PriceSample[],
  start: string,
  end: string
): SeriesPoint[] {
  const inWindow = series
    .filter((s) => s.date >= start && s.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (inWindow.length === 0) return []
  const base = inWindow[0].close
  if (base <= 0) return []
  return inWindow.map((s) => ({ date: s.date, index: (s.close / base) * 100 }))
}
