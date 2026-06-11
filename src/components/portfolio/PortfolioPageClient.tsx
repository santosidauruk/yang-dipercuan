'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStocksPrices } from '@/hooks/useStocks'
import { usePurchases } from '@/stores/usePurchases'
import { useSales } from '@/stores/useSales'
import { useDividends } from '@/stores/useDividends'
import { useStockMeta } from '@/stores/useStockMeta'
import { fetchStockProfile } from '@/lib/stock-meta'
import {
  allocations as buildAllocations,
  holdings as buildHoldings,
  summary as buildSummary
} from '@/lib/portfolio'
import { SummaryCard } from './SummaryCard'
import { HoldingsTable, type HoldingRow } from './HoldingsTable'
import { AllocationDonut } from './AllocationDonut'
import { HoldingDrillDown } from './HoldingDrillDown'
import { PerformanceChart } from './PerformanceChart'

export function PortfolioPageClient() {
  const purchases = usePurchases((s) => s.purchases)
  const sales = useSales((s) => s.sales)
  const dividends = useDividends((s) => s.dividends)
  const meta = useStockMeta((s) => s.meta)
  const setMeta = useStockMeta((s) => s.setMeta)

  const hs = useMemo(() => buildHoldings(purchases, sales), [purchases, sales])
  const heldCodes = useMemo(() => hs.map((h) => h.code), [hs])
  const yahooSymbols = useMemo(
    () => heldCodes.map((c) => `${c}.JK`),
    [heldCodes]
  )

  const { data: yahooPrices = {} } = useStocksPrices(yahooSymbols)

  // Map yahoo-suffixed prices to bare codes
  const prices = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {}
    for (const code of heldCodes) {
      const p = yahooPrices[`${code}.JK`]
      if (typeof p === 'number') out[code] = p
    }
    return out
  }, [yahooPrices, heldCodes])

  // Hydrate missing meta entries (cache "Unknown" on failure)
  useEffect(() => {
    for (const code of heldCodes) {
      if (meta[code]) continue
      fetchStockProfile(code)
        .then((m) => setMeta(code, m))
        .catch(() => setMeta(code, { name: code, sector: 'Unknown' }))
    }
  }, [heldCodes, meta, setMeta])

  const summary = useMemo(
    () => buildSummary(purchases, sales, dividends, prices),
    [purchases, sales, dividends, prices]
  )

  const totalMarketValue = summary.totalCurrentValue
  const rows = useMemo<HoldingRow[]>(() => {
    return hs.map((h) => {
      const last = prices[h.code]
      const marketValue = (last ?? 0) * h.shares
      const pct =
        last !== undefined && h.avgCost > 0
          ? ((last - h.avgCost) / h.avgCost) * 100
          : null
      const allocationPct =
        totalMarketValue > 0 ? (marketValue / totalMarketValue) * 100 : 0
      return {
        ...h,
        lastPrice: last,
        marketValue,
        pct,
        allocationPct
      }
    })
  }, [hs, prices, totalMarketValue])

  const [allocMode, setAllocMode] = useState<'issuer' | 'sector'>('issuer')
  const slices = useMemo(
    () => buildAllocations(hs, prices, meta, allocMode),
    [hs, prices, meta, allocMode]
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground text-sm">
          Last price + change refresh every 30s.
        </p>
      </div>
      <SummaryCard summary={summary} />
      <PerformanceChart purchases={purchases} sales={sales} />
      <AllocationDonut
        slices={slices}
        mode={allocMode}
        onModeChange={setAllocMode}
      />
      <HoldingsTable
        rows={rows}
        renderDrillDown={(code) => (
          <HoldingDrillDown
            code={code}
            purchases={purchases}
            sales={sales}
            dividends={dividends}
          />
        )}
      />
    </div>
  )
}
