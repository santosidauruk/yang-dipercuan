'use client'

import { use } from 'react'
import { StockDetailPageClient } from '@/components/stocks/StockDetailPageClient'

export default function StockDetailPage({
  params
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  return <StockDetailPageClient code={code} />
}
