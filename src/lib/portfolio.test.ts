import { describe, it, expect } from 'vitest'
import { qty, avgCost } from './portfolio'
import type { Purchase, Sale } from '@/types'

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
