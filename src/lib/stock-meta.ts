import type { StockMeta } from '@/stores/useStockMeta'

export async function fetchStockProfile(code: string): Promise<StockMeta> {
  const res = await fetch(`/api/stocks/${code}/profile`)
  if (!res.ok) {
    throw new Error(`Failed to fetch profile for ${code}: ${res.status}`)
  }
  const body = await res.json()
  return { name: body.name, sector: body.sector }
}
