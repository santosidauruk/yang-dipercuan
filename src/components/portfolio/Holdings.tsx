'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, ArrowUp, ArrowDown } from 'lucide-react'
import { HoldingWithMarket } from '@/types'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnrealizedPnL } from './UnrealizedPnL'

type SortKey =
  | 'stockCode'
  | 'currentValue'
  | 'unrealizedPnLPercent'
  | 'quantity'
type SortDir = 'asc' | 'desc'

interface Props {
  holdings: HoldingWithMarket[]
  onEdit: (h: HoldingWithMarket) => void
}

export function Holdings({ holdings, onEdit }: Props) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('currentValue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [holdings, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return null
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    )
  }

  function sortableHead(label: string, col: SortKey) {
    return (
      <TableHead
        className="cursor-pointer select-none"
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortIcon col={col} />
      </TableHead>
    )
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            No holdings yet — add your first one above.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      <CardContent className="p-0 px-4">
        <Table>
          <TableHeader>
            <TableRow>
              {sortableHead('Code', 'stockCode')}
              <TableHead>Name</TableHead>
              {sortableHead('Qty', 'quantity')}
              <TableHead>Avg Price</TableHead>
              <TableHead>Current Price</TableHead>
              {sortableHead('Value', 'currentValue')}
              {sortableHead('P&L', 'unrealizedPnLPercent')}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((h) => (
              <TableRow
                key={h.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/stocks/${encodeURIComponent(h.stockCode)}`)
                }
              >
                <TableCell className="font-medium">
                  {h.stockCode.replace('.JK', '')}
                </TableCell>
                <TableCell>{h.stockName}</TableCell>
                <TableCell>{formatNumber(h.quantity)}</TableCell>
                <TableCell>{formatCurrency(h.avgBuyPrice)}</TableCell>
                <TableCell>{formatCurrency(h.currentPrice)}</TableCell>
                <TableCell>{formatCurrency(h.currentValue)}</TableCell>
                <TableCell>
                  <UnrealizedPnL
                    value={h.unrealizedPnL}
                    percent={h.unrealizedPnLPercent}
                    compact
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(h)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit {h.stockCode}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
