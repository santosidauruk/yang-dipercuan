import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/yahoo-finance'

export const revalidate = 86400

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const upper = code.toUpperCase()
  const symbol = upper.endsWith('.JK') ? upper : `${upper}.JK`
  const bareCode = upper.replace(/\.JK$/, '')

  try {
    const summary = await getProfile(symbol)
    const name = summary?.price?.longName ?? summary?.price?.shortName ?? bareCode
    const sector = summary?.assetProfile?.sector ?? 'Unknown'
    return NextResponse.json({ code: bareCode, name, sector })
  } catch (error) {
    console.error(`Failed to fetch profile ${symbol}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch stock profile' },
      { status: 500 }
    )
  }
}
