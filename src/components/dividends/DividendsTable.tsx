'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatCompactNumber, formatCurrency, formatPercentage } from '@/lib/utils'
import { formatDateDisplay } from '@/lib/date'
import { dividendRow } from '@/lib/portfolio'
import type { Dividend, Purchase, Sale } from '@/types'

interface DividendsTableProps {
  dividends: Dividend[]
  purchases: Purchase[]
  sales: Sale[]
  onDelete: (dividend: Dividend) => void
}

export function DividendsTable({
  dividends,
  purchases,
  sales,
  onDelete
}: DividendsTableProps) {
  if (dividends.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
        No dividends yet. Click <span className="font-medium">Add</span> to
        record your first dividend.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Tanggal Penerimaan</TableHead>
            <TableHead className="text-center">Kode Saham</TableHead>
            <TableHead className="text-center">Harga Beli Rata-Rata</TableHead>
            <TableHead className="text-center">Jumlah Lot</TableHead>
            <TableHead className="text-center">Nilai Investasi</TableHead>
            <TableHead className="text-center">DPS</TableHead>
            <TableHead className="text-center">Yield %</TableHead>
            <TableHead className="text-center">Total Dividend</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dividends.map((d) => {
            const row = dividendRow(purchases, sales, d)
            const avgCostVal = row.qtyHeld > 0
              ? row.purchaseValue / (row.qtyHeld * 100)
              : 0
            return (
              <TableRow key={d.id}>
                <TableCell>{formatDateDisplay(d.date)}</TableCell>
                <TableCell className="font-medium">{d.code}</TableCell>
                <TableCell className="text-center">
                  {avgCostVal > 0 ? formatCurrency(avgCostVal) : '—'}
                </TableCell>
                <TableCell className="text-center">{row.qtyHeld}</TableCell>
                <TableCell className="text-center">
                  {row.purchaseValue > 0
                    ? formatCurrency(row.purchaseValue)
                    : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(d.dps)}
                </TableCell>
                <TableCell className="text-center">
                  {row.yieldPct > 0 ? formatPercentage(row.yieldPct) : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(row.totalDividend)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(d)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
