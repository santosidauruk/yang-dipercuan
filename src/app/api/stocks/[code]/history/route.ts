import { NextResponse } from 'next/server'
import { getHistoricalData } from '@/lib/yahoo-finance'
import type { OHLCV } from '@/types'
import { IHSG_CODE } from '@/lib/constants'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const symbol = code.toUpperCase().endsWith('.JK') || code.toUpperCase() === IHSG_CODE
    ? code.toUpperCase()
    : `${code.toUpperCase()}.JK`

  const { searchParams } = new URL(request.url)
  const interval = searchParams.get('interval') ?? '1d'
  const range = searchParams.get('range') ?? '6mo'

  try {
    const result = await getHistoricalData(symbol, interval, range)

    console.log('result', result)

    const ohlcv: OHLCV[] = (result.quotes ?? [])
      .filter(
        (q: any) =>
          q.open != null && q.high != null && q.low != null && q.close != null
      )
      .map((q: any) => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume ?? 0
      }))

    return NextResponse.json(ohlcv)
  } catch (error) {
    console.error(`Failed to fetch history for ${symbol}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}
