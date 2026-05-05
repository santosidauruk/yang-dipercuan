import { describe, it, expect } from 'vitest'
import { qty, avgCost, costBasisAt, realizedPL, dividendRow, dividendTotal } from './portfolio'
import type { Purchase, Sale, Dividend } from '@/types'

const buy = (
  code: string,
  date: string,
  lots: number,
  price: number
): Purchase => ({
  id: `${code}-${date}-${lots}`,
  code,
  date,
  lots,
  price
})

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

describe('qty', () => {
  it('returns 0 when no records exist for the code', () => {
    expect(qty([], [], 'BBCA')).toBe(0)
  })

  it('only counts purchases for the requested code', () => {
    const purchases = [buy('BBCA', '2026-01-01', 5, 9000), buy('PGAS', '2026-01-02', 3, 1500)]
    expect(qty(purchases, [], 'BBCA')).toBe(500)
  })

  it('subtracts sale lots and converts lots to shares (1 lot = 100)', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 3, 9500, 9000)]
    expect(qty(purchases, sales, 'BBCA')).toBe(700)
  })

  it('respects asOf cutoff (inclusive)', () => {
    const purchases = [
      buy('BBCA', '2026-01-15', 5, 9000),
      buy('BBCA', '2026-03-01', 5, 9500)
    ]
    expect(qty(purchases, [], 'BBCA', '2026-02-01')).toBe(500)
    expect(qty(purchases, [], 'BBCA', '2026-03-01')).toBe(1000)
  })
})

describe('avgCost', () => {
  it('returns 0 when no purchases exist for the code', () => {
    expect(avgCost([], 'BBCA')).toBe(0)
  })

  it('returns the lot-weighted average price for the code', () => {
    const purchases = [
      buy('BBCA', '2026-01-01', 4, 9000),
      buy('BBCA', '2026-02-01', 6, 9500)
    ]
    // (4*9000 + 6*9500) / (4+6) = (36000 + 57000) / 10 = 9300
    expect(avgCost(purchases, 'BBCA')).toBe(9300)
  })

  it('ignores purchases of other codes', () => {
    const purchases = [
      buy('BBCA', '2026-01-01', 4, 9000),
      buy('PGAS', '2026-01-02', 100, 1500)
    ]
    expect(avgCost(purchases, 'BBCA')).toBe(9000)
  })

  it('respects asOf cutoff', () => {
    const purchases = [
      buy('BBCA', '2026-01-01', 4, 9000),
      buy('BBCA', '2026-03-01', 6, 9500)
    ]
    expect(avgCost(purchases, 'BBCA', '2026-02-01')).toBe(9000)
  })
})

const div = (code: string, date: string, dps: number): Dividend => ({
  id: `d-${code}-${date}`,
  code,
  date,
  dps
})

describe('costBasisAt', () => {
  it('returns avgCost at the given date', () => {
    const purchases = [
      buy('BBCA', '2026-01-01', 4, 9000),
      buy('BBCA', '2026-03-01', 6, 9500)
    ]
    expect(costBasisAt(purchases, 'BBCA', '2026-02-01')).toBe(9000)
  })

  it('returns 0 when no purchases for code', () => {
    expect(costBasisAt([], 'BBCA', '2026-01-01')).toBe(0)
  })
})

describe('realizedPL', () => {
  it('returns 0 when no sales', () => {
    expect(realizedPL([])).toBe(0)
  })

  it('sums (price - costBasis) * lots * 100 across all sales', () => {
    const sales = [
      sell('BBCA', '2026-02-01', 3, 10000, 9000),
      sell('BBCA', '2026-03-01', 2, 9800, 9500)
    ]
    // 3*100*(10000-9000) + 2*100*(9800-9500) = 300000 + 60000 = 360000
    expect(realizedPL(sales)).toBe(360000)
  })

  it('filters by code when provided', () => {
    const sales = [
      sell('BBCA', '2026-02-01', 3, 10000, 9000),
      sell('PGAS', '2026-02-05', 5, 1600, 1500)
    ]
    // BBCA only: 3*100*(10000-9000) = 300000
    expect(realizedPL(sales, 'BBCA')).toBe(300000)
  })

  it('returns negative PL for a loss', () => {
    const sales = [sell('BBCA', '2026-02-01', 2, 8000, 9000)]
    // 2*100*(8000-9000) = -200000
    expect(realizedPL(sales)).toBe(-200000)
  })
})

describe('dividendRow', () => {
  it('returns zeros when no purchases for code', () => {
    const d = div('BBCA', '2026-03-01', 50)
    const row = dividendRow([], [], d)
    expect(row).toEqual({ qtyHeld: 0, totalDividend: 0, yieldPct: 0, purchaseValue: 0 })
  })

  it('computes derived fields from purchases and sales at dividend date', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 3, 10000, 9000)]
    const d = div('BBCA', '2026-03-01', 50)
    // qtyHeld = qty(10-3) * 100 = 700 shares → 7 lots
    // totalDividend = 50 * 700 = 35000
    // yieldPct = (50 / 9000) * 100 ≈ 0.5556
    // purchaseValue = 9000 * 700 = 6300000
    const row = dividendRow(purchases, sales, d)
    expect(row.qtyHeld).toBe(7)
    expect(row.totalDividend).toBe(35000)
    expect(row.yieldPct).toBeCloseTo(0.5556, 3)
    expect(row.purchaseValue).toBe(6300000)
  })
})

describe('dividendTotal', () => {
  it('returns 0 when no dividends', () => {
    expect(dividendTotal([], [], [])).toBe(0)
  })

  it('sums totalDividend across all dividends', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const dividends = [
      div('BBCA', '2026-03-01', 50),
      div('BBCA', '2026-06-01', 75)
    ]
    // both: 50*1000 + 75*1000 = 125000
    expect(dividendTotal(purchases, [], dividends)).toBe(125000)
  })

  it('filters by code when provided', () => {
    const purchases = [
      buy('BBCA', '2026-01-01', 10, 9000),
      buy('PGAS', '2026-01-01', 5, 1500)
    ]
    const dividends = [
      div('BBCA', '2026-03-01', 50),
      div('PGAS', '2026-03-01', 20)
    ]
    // BBCA only: 50*1000 = 50000
    expect(dividendTotal(purchases, [], dividends, 'BBCA')).toBe(50000)
  })
})
