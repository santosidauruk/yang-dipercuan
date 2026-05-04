import type { Purchase, Sale } from '@/types'

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
