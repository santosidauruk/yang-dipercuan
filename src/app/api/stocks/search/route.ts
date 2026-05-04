/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { searchStocks } from '@/lib/yahoo-finance'
import type { StockSearchResult } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 1) {
    return NextResponse.json([])
  }

  try {
    const results = await searchStocks(query)
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
