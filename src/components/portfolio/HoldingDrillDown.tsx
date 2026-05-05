'use client'

import { formatNumber } from '@/lib/utils'
import type { Purchase, Sale, Dividend } from '@/types'

interface HoldingDrillDownProps {
  code: string
  purchases: Purchase[]
  sales: Sale[]
  dividends: Dividend[]
}

export function HoldingDrillDown({
  code,
  purchases,
  sales,
  dividends
}: HoldingDrillDownProps) {
  const codePurchases = purchases.filter((p) => p.code === code)
  const codeSales = sales.filter((s) => s.code === code)
  const codeDividends = dividends.filter((d) => d.code === code)

  return (
    <div
      data-testid={`drilldown-${code}`}
      className="bg-muted/40 grid gap-4 p-4 md:grid-cols-3"
    >
      <Section title="Purchases">
        {codePurchases.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-1">
            {codePurchases.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>{p.date}</span>
                <span>
                  {p.lots} lots @ {formatNumber(p.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Sales">
        {codeSales.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-1">
            {codeSales.map((s) => (
              <li key={s.id} className="flex justify-between gap-2">
                <span>{s.date}</span>
                <span>
                  {s.lots} lots @ {formatNumber(s.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Dividends">
        {codeDividends.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-1">
            {codeDividends.map((d) => (
              <li key={d.id} className="flex justify-between gap-2">
                <span>{d.date}</span>
                <span>{formatNumber(d.dps)} / share</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Section({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="text-muted-foreground text-xs uppercase tracking-wide">
        {title}
      </div>
      {children}
    </div>
  )
}

function Empty() {
  return <div className="text-muted-foreground text-xs">None</div>
}
