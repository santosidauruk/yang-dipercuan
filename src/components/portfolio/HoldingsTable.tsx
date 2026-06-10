'use client'

import Link from 'next/link'
import { Fragment, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn, formatNumber, formatPercentage } from '@/lib/utils'
import type { Holding } from '@/lib/portfolio'

export interface HoldingRow extends Holding {
  lastPrice: number | undefined
  marketValue: number
  pct: number | null
  allocationPct: number
}

type SortKey =
  | 'code'
  | 'lots'
  | 'avgCost'
  | 'lastPrice'
  | 'invested'
  | 'marketValue'
  | 'pct'
  | 'allocationPct'
type SortDir = 'asc' | 'desc'

interface HoldingsTableProps {
  rows: HoldingRow[]
  renderDrillDown?: (code: string) => React.ReactNode
}

export function HoldingsTable({ rows, renderDrillDown }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('code')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expanded, setExpanded] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
        No holdings yet. Add a purchase to see it here.
      </div>
    )
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    const dir = sortDir === 'asc' ? 1 : -1
    if (typeof av === 'string' && typeof bv === 'string') {
      return av.localeCompare(bv) * dir
    }
    return ((av as number) - (bv as number)) * dir
  })

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'code' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead
              k="code"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            >
              Kode Saham
            </SortableHead>
            <SortableHead
              k="lots"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              align="right"
            >
              Jumlah Lot
            </SortableHead>
            <SortableHead
              k="avgCost"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              align="right"
            >
              Harga Rata-rata
            </SortableHead>
            <SortableHead
              k="lastPrice"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              align="right"
            >
              Harga Terakhir
            </SortableHead>
            <SortableHead
              k="invested"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              align="right"
            >
              Nilai Investasi
            </SortableHead>
            <SortableHead
              k="marketValue"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              align="right"
            >
              Nilai Pasar
            </SortableHead>
            <SortableHead
              k="pct"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              align="right"
            >
              Kenaikan/Penurunan
            </SortableHead>
            <SortableHead
              k="allocationPct"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              align="right"
            >
              Alokasi %
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <Fragment key={row.code}>
            <TableRow
              className={cn(renderDrillDown && 'cursor-pointer')}
              onClick={() =>
                renderDrillDown &&
                setExpanded((cur) => (cur === row.code ? null : row.code))
              }
            >
              <TableCell className="font-medium">
                <Link
                  href={`/stocks/${row.code}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.code}
                </Link>
              </TableCell>
              <TableCell className="text-right">{row.lots}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.avgCost)}
              </TableCell>
              <TableCell className="text-right">
                {row.lastPrice !== undefined
                  ? formatNumber(row.lastPrice)
                  : '—'}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.invested)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.marketValue)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right',
                  row.pct === null && 'text-muted-foreground',
                  row.pct !== null &&
                    row.pct > 0 &&
                    'text-emerald-600 dark:text-emerald-400',
                  row.pct !== null &&
                    row.pct < 0 &&
                    'text-red-600 dark:text-red-400'
                )}
              >
                {row.pct === null ? '—' : formatPercentage(row.pct)}
              </TableCell>
              <TableCell className="text-right">
                {row.allocationPct.toFixed(2)}%
              </TableCell>
            </TableRow>
            {renderDrillDown && expanded === row.code && (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  {renderDrillDown(row.code)}
                </TableCell>
              </TableRow>
            )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function SortableHead({
  children,
  k,
  sortKey,
  sortDir,
  onSort,
  align = 'left'
}: {
  children: React.ReactNode
  k: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = sortKey === k
  const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead className={cn(align === 'right' && 'text-right')}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(k)}
        className={cn(
          '-ml-2 h-7 px-2',
          align === 'right' && '-mr-2 ml-auto flex'
        )}
      >
        {children}
        <Icon className="ml-1 h-3 w-3" />
      </Button>
    </TableHead>
  )
}
