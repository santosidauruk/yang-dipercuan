import { describe, it, expect } from 'vitest'
import {
  qty,
  avgCost,
  costBasisAt,
  realizedPL,
  dividendRow,
  dividendTotal,
  holdings,
  summary,
  allocations,
  wouldCauseNegativeQty
} from './portfolio'
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

describe('holdings', () => {
  it('returns [] when no purchases', () => {
    expect(holdings([], [])).toEqual([])
  })

  it('builds a single holding from one purchase', () => {
    const purchases = [buy('BBCA', '2026-01-01', 5, 9000)]
    expect(holdings(purchases, [])).toEqual([
      {
        code: 'BBCA',
        lots: 5,
        shares: 500,
        avgCost: 9000,
        invested: 4_500_000
      }
    ])
  })

  it('reduces lots and shares by partial sales', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 3, 9500, 9000)]
    const [h] = holdings(purchases, sales)
    expect(h.lots).toBe(7)
    expect(h.shares).toBe(700)
    expect(h.invested).toBe(9000 * 700)
  })

  it('excludes fully-sold codes', () => {
    const purchases = [buy('BBCA', '2026-01-01', 5, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 5, 9500, 9000)]
    expect(holdings(purchases, sales)).toEqual([])
  })

  it('returns multiple holdings sorted by code asc', () => {
    const purchases = [
      buy('PGAS', '2026-01-01', 5, 1500),
      buy('BBCA', '2026-01-01', 4, 9000),
      buy('ANTM', '2026-01-01', 2, 2000)
    ]
    expect(holdings(purchases, []).map((h) => h.code)).toEqual([
      'ANTM',
      'BBCA',
      'PGAS'
    ])
  })
})

describe('summary', () => {
  it('returns all zeros for empty inputs', () => {
    expect(summary([], [], [], {})).toEqual({
      totalInvested: 0,
      totalCurrentValue: 0,
      unrealizedPL: 0,
      realizedGain: 0,
      totalDividends: 0,
      netCapitalChange: 0
    })
  })

  it('aggregates per PRD §5.2: netCapitalChange = unrealizedPL + realizedPL + dividends', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 3, 10_000, 9000)]
    const dividends = [div('BBCA', '2026-03-01', 50)]
    const prices = { BBCA: 11_000 }

    expect(summary(purchases, sales, dividends, prices)).toEqual({
      totalInvested: 6_300_000, // 700 shares * 9000
      totalCurrentValue: 7_700_000, // 700 * 11000
      unrealizedPL: 1_400_000,
      realizedGain: 300_000, // 3 * 100 * (10000-9000)
      totalDividends: 35_000, // 50 * 700
      netCapitalChange: 1_735_000
    })
  })

  it('treats missing prices as 0 (current value contribution)', () => {
    const purchases = [buy('BBCA', '2026-01-01', 5, 9000)]
    const result = summary(purchases, [], [], {})
    expect(result.totalCurrentValue).toBe(0)
    expect(result.unrealizedPL).toBe(-result.totalInvested)
  })
})

describe('allocations', () => {
  it('returns [] when no holdings', () => {
    expect(allocations([], {}, {}, 'issuer')).toEqual([])
  })

  it('issuer mode: one entry per held code with marketValue + pct', () => {
    const hs = holdings(
      [buy('BBCA', '2026-01-01', 5, 9000), buy('PGAS', '2026-01-01', 10, 1500)],
      []
    )
    const prices = { BBCA: 10000, PGAS: 2000 }
    // BBCA mv = 500*10000 = 5_000_000; PGAS mv = 1000*2000 = 2_000_000; total = 7_000_000
    const result = allocations(hs, prices, {}, 'issuer')
    expect(result).toEqual([
      { label: 'BBCA', value: 5_000_000, pct: (5_000_000 / 7_000_000) * 100 },
      { label: 'PGAS', value: 2_000_000, pct: (2_000_000 / 7_000_000) * 100 }
    ])
  })

  it('sector mode: groups market value by meta sector', () => {
    const hs = holdings(
      [
        buy('BBCA', '2026-01-01', 5, 9000),
        buy('BMRI', '2026-01-01', 5, 5000),
        buy('PGAS', '2026-01-01', 10, 1500)
      ],
      []
    )
    const prices = { BBCA: 10000, BMRI: 6000, PGAS: 2000 }
    const meta = {
      BBCA: { name: 'Bank Central Asia', sector: 'Financial Services' },
      BMRI: { name: 'Bank Mandiri', sector: 'Financial Services' },
      PGAS: { name: 'Perusahaan Gas Negara', sector: 'Energy' }
    }
    // Financial Services = 5_000_000 + 3_000_000 = 8_000_000
    // Energy = 2_000_000
    const result = allocations(hs, prices, meta, 'sector')
    const total = 10_000_000
    expect(result).toEqual([
      {
        label: 'Financial Services',
        value: 8_000_000,
        pct: (8_000_000 / total) * 100
      },
      { label: 'Energy', value: 2_000_000, pct: (2_000_000 / total) * 100 }
    ])
  })

  it('sector mode: codes without meta entry bucket as "Unknown"', () => {
    const hs = holdings([buy('XYZA', '2026-01-01', 5, 1000)], [])
    const prices = { XYZA: 1500 }
    const result = allocations(hs, prices, {}, 'sector')
    expect(result).toEqual([{ label: 'Unknown', value: 750_000, pct: 100 }])
  })
})

describe('wouldCauseNegativeQty', () => {
  it('returns false when no sales exist for the affected code', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    expect(
      wouldCauseNegativeQty(purchases, [], purchases[0].id, { lots: 1 })
    ).toBe(false)
  })

  it('returns true when reducing lots makes a later sale exceed holdings', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 7, 9500, 9000)]
    expect(
      wouldCauseNegativeQty(purchases, sales, purchases[0].id, { lots: 5 })
    ).toBe(true)
  })

  it('returns true when moving purchase date past an existing sale', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 7, 9500, 9000)]
    expect(
      wouldCauseNegativeQty(purchases, sales, purchases[0].id, {
        date: '2026-03-01'
      })
    ).toBe(true)
  })

  it('returns false when patch only changes price', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 7, 9500, 9000)]
    expect(
      wouldCauseNegativeQty(purchases, sales, purchases[0].id, { price: 8500 })
    ).toBe(false)
  })

  it('returns true when code changes away and leaves old-code sales orphaned', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales = [sell('BBCA', '2026-02-01', 7, 9500, 9000)]
    expect(
      wouldCauseNegativeQty(purchases, sales, purchases[0].id, { code: 'PGAS' })
    ).toBe(true)
  })

  it('returns false for unknown id', () => {
    const purchases = [buy('BBCA', '2026-01-01', 10, 9000)]
    expect(wouldCauseNegativeQty(purchases, [], 'unknown', { lots: 1 })).toBe(
      false
    )
  })
})
