import type { Purchase, Sale, Dividend } from '@/types'

const SHARES_PER_LOT = 100

export interface Holding {
  code: string
  lots: number
  shares: number
  avgCost: number
  invested: number
}

const onOrBefore = (date: string, asOf?: string) =>
  asOf === undefined ? true : date <= asOf

export function qty(
  purchases: Purchase[],
  sales: Sale[],
  code: string,
  asOf?: string
): number {
  const buyLots = purchases
    .filter((p) => p.code === code && onOrBefore(p.date, asOf))
    .reduce((sum, p) => sum + p.lots, 0)

  const sellLots = sales
    .filter((s) => s.code === code && onOrBefore(s.date, asOf))
    .reduce((sum, s) => sum + s.lots, 0)

  return (buyLots - sellLots) * SHARES_PER_LOT
}

export function avgCost(
  purchases: Purchase[],
  code: string,
  asOf?: string
): number {
  const eligible = purchases.filter(
    (p) => p.code === code && onOrBefore(p.date, asOf)
  )
  if (eligible.length === 0) return 0

  const totalLots = eligible.reduce((sum, p) => sum + p.lots, 0)
  if (totalLots === 0) return 0

  const totalCost = eligible.reduce((sum, p) => sum + p.lots * p.price, 0)
  return totalCost / totalLots
}

export function costBasisAt(
  purchases: Purchase[],
  code: string,
  asOf: string
): number {
  return avgCost(purchases, code, asOf)
}

export function realizedPL(sales: Sale[], code?: string): number {
  const filtered = code ? sales.filter((s) => s.code === code) : sales
  return filtered.reduce(
    (sum, s) => sum + (s.price - s.costBasis) * s.lots * SHARES_PER_LOT,
    0
  )
}

export function dividendRow(
  purchases: Purchase[],
  sales: Sale[],
  div: Dividend
): {
  qtyHeld: number
  totalDividend: number
  yieldPct: number
  purchaseValue: number
} {
  const shares = qty(purchases, sales, div.code, div.date)
  const cost = avgCost(purchases, div.code, div.date)
  return {
    qtyHeld: shares / SHARES_PER_LOT,
    totalDividend: div.dps * shares,
    yieldPct: cost > 0 ? (div.dps / cost) * 100 : 0,
    purchaseValue: cost * shares
  }
}

export function holdings(
  purchases: Purchase[],
  sales: Sale[],
  asOf?: string
): Holding[] {
  const codes = Array.from(new Set(purchases.map((p) => p.code))).sort()
  const out: Holding[] = []
  for (const code of codes) {
    const shares = qty(purchases, sales, code, asOf)
    if (shares <= 0) continue
    const cost = avgCost(purchases, code, asOf)
    out.push({
      code,
      lots: shares / SHARES_PER_LOT,
      shares,
      avgCost: cost,
      invested: cost * shares
    })
  }
  return out
}

export interface PortfolioSummary {
  totalInvested: number
  totalCurrentValue: number
  unrealizedPL: number
  realizedGain: number
  totalDividends: number
  netCapitalChange: number
}

export function summary(
  purchases: Purchase[],
  sales: Sale[],
  dividends: Dividend[],
  prices: Record<string, number>
): PortfolioSummary {
  const hs = holdings(purchases, sales)
  const totalInvested = hs.reduce((s, h) => s + h.invested, 0)
  const totalCurrentValue = hs.reduce(
    (s, h) => s + (prices[h.code] ?? 0) * h.shares,
    0
  )
  const unrealizedPL = totalCurrentValue - totalInvested
  const realizedGain = realizedPL(sales)
  const totalDividends = dividendTotal(purchases, sales, dividends)
  console.log({ hs, totalInvested, totalCurrentValue, unrealizedPL, realizedGain, totalDividends })
  console.log({sales})
  return {
    totalInvested,
    totalCurrentValue,
    unrealizedPL,
    realizedGain,
    totalDividends,
    netCapitalChange: unrealizedPL + realizedGain + totalDividends
  }
}

export interface AllocationSlice {
  label: string
  value: number
  pct: number
}

export function allocations(
  hs: Holding[],
  prices: Record<string, number>,
  meta: Record<string, { name: string; sector: string }>,
  mode: 'issuer' | 'sector'
): AllocationSlice[] {
  if (hs.length === 0) return []

  const buckets = new Map<string, number>()
  for (const h of hs) {
    const last = prices[h.code] ?? 0
    const value = last * h.shares
    if (value === 0) continue
    const label =
      mode === 'issuer' ? h.code : (meta[h.code]?.sector ?? 'Unknown')
    buckets.set(label, (buckets.get(label) ?? 0) + value)
  }

  const total = Array.from(buckets.values()).reduce((s, v) => s + v, 0)
  const out: AllocationSlice[] = []
  for (const [label, value] of buckets) {
    out.push({ label, value, pct: total > 0 ? (value / total) * 100 : 0 })
  }
  out.sort((a, b) => b.value - a.value)
  return out
}

export function wouldCauseNegativeQty(
  purchases: Purchase[],
  sales: Sale[],
  editedId: string,
  patch: Partial<Omit<Purchase, 'id'>>
): boolean {
  const orig = purchases.find((p) => p.id === editedId)
  if (!orig) return false
  const updated: Purchase = { ...orig, ...patch }
  const next = purchases.map((p) => (p.id === editedId ? updated : p))
  const codes = new Set([orig.code, updated.code])
  for (const code of codes) {
    const dates = sales.filter((s) => s.code === code).map((s) => s.date)
    for (const d of dates) {
      if (qty(next, sales, code, d) < 0) return true
    }
  }
  return false
}

export function dividendTotal(
  purchases: Purchase[],
  sales: Sale[],
  dividends: Dividend[],
  code?: string
): number {
  const rows = code ? dividends.filter((d) => d.code === code) : dividends
  return rows.reduce(
    (sum, d) => sum + dividendRow(purchases, sales, d).totalDividend,
    0
  )
}
