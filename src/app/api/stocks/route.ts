import { NextResponse } from 'next/server'
import { getQuotes } from '@/lib/yahoo-finance'
import { IDX_STOCKS } from '@/lib/constants'
import type { Stock } from '@/types'

export const revalidate = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sector = searchParams.get('sector')

  try {
    let stockList = IDX_STOCKS
    if (sector) {
      stockList = stockList.filter((s) => s.sector === sector)
    }

    const codes = stockList.map((s) => s.code)
    const quotes = await getQuotes(codes)

    const stocks: Stock[] = quotes
      .map((quote) => {
        const info = stockList.find((s) => s.code === quote.symbol)
        if (!info || !quote.regularMarketPrice) return null

        return {
          code: quote.symbol,
          name: info.name,
          sector: info.sector,
          price: quote.regularMarketPrice,
          previousClose: quote.regularMarketPreviousClose ?? 0,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
          volume: quote.regularMarketVolume ?? 0,
          marketCap: quote.marketCap ?? 0,
          high: quote.regularMarketDayHigh ?? 0,
          low: quote.regularMarketDayLow ?? 0,
          open: quote.regularMarketOpen ?? 0
        }
      })
      .filter((s): s is Stock => s !== null)

    return NextResponse.json(stocks)
  } catch (error) {
    console.error('Failed to fetch stocks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
