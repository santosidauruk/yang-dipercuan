import { NextResponse } from 'next/server'
import { searchStocks } from '@/lib/yahoo-finance'
import type { StockSearchResult } from '@/types'
import { IDX_STOCKS } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 1) {
    return NextResponse.json([])
  }

  try {
    // First try local search from our IDX list
    const localResults = IDX_STOCKS.filter(
      (s) =>
        s.code.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    ).map(
      (s): StockSearchResult => ({
        code: s.code,
        name: s.name,
        sector: s.sector,
        exchange: 'JKT'
      })
    )

    if (localResults.length > 0) {
      return NextResponse.json(localResults)
    }

    // Fallback to Yahoo Finance search
    const results = await searchStocks(query)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stockResults: StockSearchResult[] = (results.quotes ?? [])
      .filter((q: any) => q.symbol?.endsWith('.JK'))
      .map((q: any) => ({
        code: q.symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        sector: '',
        exchange: q.exchange ?? 'JKT'
      }))

    return NextResponse.json(stockResults)
  } catch (error) {
    console.error('Failed to search stocks:', error)
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}
