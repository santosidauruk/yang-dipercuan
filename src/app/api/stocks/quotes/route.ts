/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getQuote } from '@/lib/yahoo-finance'

export const revalidate = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codesParams = searchParams.get('codes')

  if (!codesParams) {
    return NextResponse.json(
      { error: 'Please provide stock codes' },
      { status: 400 }
    )
  }

  const codes = codesParams.split(',')

  try {
    const data: any[] = await getQuote(codes, [
      'symbol',
      'regularMarketPrice',
      'regularMarketChangePercent'
    ])

    const quotes = data.reduce<
      Record<string, { price: number; changePercent: number }>
    >((acc, curr) => {
      acc[curr.symbol] = {
        price: curr.regularMarketPrice,
        changePercent: curr.regularMarketChangePercent
      }
      return acc
    }, {})

    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Failed to fetch stock quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
