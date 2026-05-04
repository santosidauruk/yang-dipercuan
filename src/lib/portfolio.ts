import type { Purchase, Sale, Dividend } from '@/types'

const SHARES_PER_LOT = 100

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
