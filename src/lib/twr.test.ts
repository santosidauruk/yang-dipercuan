import { describe, it, expect } from 'vitest'
import { resolveWindow, computeTwrSeries, computeBenchmarkSeries } from './twr'
import type { Purchase, Sale } from '@/types'

const buy = (
  code: string,
  date: string,
  lots: number,
  price: number
): Purchase => ({ id: `${code}-${date}-${lots}`, code, date, lots, price })

const sell = (
  code: string,
  date: string,
  lots: number,
  price: number,
  costBasis: number
): Sale => ({
  id: `s-${code}-${date}-${lots}`,
  code,
  date,
  lots,
  price,
  costBasis
})

describe('resolveWindow', () => {
  const today = '2026-05-08'

  it('1M → today minus one month', () => {
    expect(resolveWindow('1M', undefined, today).start).toBe('2026-04-08')
  })

  it('3M → today minus three months', () => {
    expect(resolveWindow('3M', undefined, today).start).toBe('2026-02-08')
  })

  it('6M → today minus six months', () => {
    expect(resolveWindow('6M', undefined, today).start).toBe('2025-11-08')
  })

  it('1Y → today minus one year', () => {
    expect(resolveWindow('1Y', undefined, today).start).toBe('2025-05-08')
  })

  it('YTD → first day of current year', () => {
    expect(resolveWindow('YTD', undefined, today).start).toBe('2026-01-01')
  })

  it('ALL → first purchase date when present', () => {
    expect(resolveWindow('ALL', '2024-03-15', today).start).toBe('2024-03-15')
  })

  it('ALL → today when no purchases', () => {
    expect(resolveWindow('ALL', undefined, today).start).toBe(today)
  })
})

describe('computeTwrSeries', () => {
  it('returns empty when no purchases', () => {
    const result = computeTwrSeries({
      purchases: [],
      sales: [],
      priceSeriesByCode: {},
      start: '2026-01-01',
      end: '2026-01-05'
    })
    expect(result).toEqual([])
  })

  it('flat prices → flat 100 series', () => {
    const purchases = [buy('BBCA', '2026-01-01', 1, 1000)]
    const result = computeTwrSeries({
      purchases,
      sales: [],
      priceSeriesByCode: {
        BBCA: [
          { date: '2026-01-01', close: 1000 },
          { date: '2026-01-02', close: 1000 },
          { date: '2026-01-03', close: 1000 }
        ]
      },
      start: '2026-01-01',
      end: '2026-01-03'
    })
    expect(result.map((p) => p.index)).toEqual([100, 100, 100])
  })

  it('price doubles → index goes 100 → 200', () => {
    const purchases = [buy('BBCA', '2026-01-01', 1, 1000)]
    const result = computeTwrSeries({
      purchases,
      sales: [],
      priceSeriesByCode: {
        BBCA: [
          { date: '2026-01-01', close: 1000 },
          { date: '2026-01-02', close: 2000 }
        ]
      },
      start: '2026-01-01',
      end: '2026-01-02'
    })
    expect(result.map((p) => p.index)).toEqual([100, 200])
  })

  it('mid-window buy is cashflow-neutralized (no TWR jump)', () => {
    // day 1: buy 1 lot @ 1000. day 2: price 2000. day 3: buy another lot @ 2000. day 4: price 2200.
    const purchases = [
      buy('BBCA', '2026-01-01', 1, 1000),
      buy('BBCA', '2026-01-03', 1, 2000)
    ]
    const result = computeTwrSeries({
      purchases,
      sales: [],
      priceSeriesByCode: {
        BBCA: [
          { date: '2026-01-01', close: 1000 },
          { date: '2026-01-02', close: 2000 },
          { date: '2026-01-03', close: 2000 },
          { date: '2026-01-04', close: 2200 }
        ]
      },
      start: '2026-01-01',
      end: '2026-01-04'
    })
    // day1=100, day2=200 (price doubled), day3=200 (buy neutral), day4=220 (+10%)
    expect(result.map((p) => Math.round(p.index * 1e6) / 1e6)).toEqual([
      100, 200, 200, 220
    ])
  })

  it('mid-window partial sale is cashflow-neutralized', () => {
    const purchases = [buy('BBCA', '2026-01-01', 2, 1000)]
    const sales = [sell('BBCA', '2026-01-02', 1, 1000, 1000)]
    const result = computeTwrSeries({
      purchases,
      sales,
      priceSeriesByCode: {
        BBCA: [
          { date: '2026-01-01', close: 1000 },
          { date: '2026-01-02', close: 1000 },
          { date: '2026-01-03', close: 1100 }
        ]
      },
      start: '2026-01-01',
      end: '2026-01-03'
    })
    // day1=100, day2=100 (sale at market neutral), day3=110 (+10%)
    expect(result.map((p) => Math.round(p.index * 1e6) / 1e6)).toEqual([
      100, 100, 110
    ])
  })

  it('rebases to 100 at window start when purchase is earlier', () => {
    const purchases = [buy('BBCA', '2025-12-01', 1, 500)]
    const result = computeTwrSeries({
      purchases,
      sales: [],
      priceSeriesByCode: {
        BBCA: [
          { date: '2025-12-01', close: 500 },
          { date: '2026-01-01', close: 1000 },
          { date: '2026-01-02', close: 1500 }
        ]
      },
      start: '2026-01-01',
      end: '2026-01-02'
    })
    // start at window: idx=100, day2: 1500/1000=1.5 → 150
    expect(result.map((p) => p.index)).toEqual([100, 150])
  })
})

describe('computeBenchmarkSeries', () => {
  it('returns empty when input empty', () => {
    expect(computeBenchmarkSeries([], '2026-01-01', '2026-01-05')).toEqual([])
  })

  it('indexes to 100 at first in-window date and tracks cumulative return', () => {
    const series = [
      { date: '2025-12-31', close: 6000 },
      { date: '2026-01-01', close: 7000 },
      { date: '2026-01-02', close: 7700 },
      { date: '2026-01-03', close: 6300 }
    ]
    const result = computeBenchmarkSeries(series, '2026-01-01', '2026-01-03')
    expect(result.map((p) => p.date)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03'
    ])
    expect(result.map((p) => Math.round(p.index))).toEqual([100, 110, 90])
  })
})
