import { NextResponse } from 'next/server'
import { getQuote } from '@/lib/yahoo-finance'

export const revalidate = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codesParams = searchParams.get('codes')

  if (!codesParams) {
    return NextResponse.json(
      { error: 'Please provide stock codes' },
      { status: 401 }
    )
  }

  const codes = codesParams.split(',')

  try {
    console.log(codes, 'codes')
    const data: any[] = await getQuote(codes, ['symbol', 'regularMarketPrice'])

    const prices = data.reduce((acc, curr) => {
      acc[curr.symbol] = curr.regularMarketPrice
      return acc
    }, {})

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Failed to fetch stock prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
