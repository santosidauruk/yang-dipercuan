import { NextResponse } from 'next/server'
import { getQuote } from '@/lib/yahoo-finance'
import { IDX_STOCKS } from '@/lib/constants'
import type { StockDetail } from '@/types'

export const revalidate = 30

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const symbol = code.toUpperCase().endsWith('.JK')
    ? code.toUpperCase()
    : `${code.toUpperCase()}.JK`

  try {
    const quote = await getQuote(symbol)
    if (!quote || !quote.regularMarketPrice) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    const info = IDX_STOCKS.find((s) => s.code === symbol)

    const stock: StockDetail = {
      code: quote.symbol,
      name: info?.name ?? quote.shortName ?? quote.longName ?? symbol,
      sector: info?.sector ?? 'Unknown',
      price: quote.regularMarketPrice,
      previousClose: quote.regularMarketPreviousClose ?? 0,
      change: quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      volume: quote.regularMarketVolume ?? 0,
      marketCap: quote.marketCap ?? 0,
      high: quote.regularMarketDayHigh ?? 0,
      low: quote.regularMarketDayLow ?? 0,
      open: quote.regularMarketOpen ?? 0,
      currency: quote.currency ?? 'IDR',
      exchange: quote.exchange ?? 'JKT',
      peRatio: quote.trailingPE ?? null,
      pbRatio: quote.priceToBook ?? null,
      dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
      roe: null,
      eps: quote.epsTrailingTwelveMonths ?? null,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? 0,
      description: ''
    }

    return NextResponse.json(stock)
  } catch (error) {
    console.error(`Failed to fetch stock ${symbol}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
