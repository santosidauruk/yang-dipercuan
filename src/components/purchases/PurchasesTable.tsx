'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import { formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Purchase } from '@/types'

interface PurchasesTableProps {
  purchases: Purchase[]
  prices: Record<string, number | undefined>
  onEdit: (purchase: Purchase) => void
  onDelete: (purchase: Purchase) => void
}

const SHARES_PER_LOT = 100

export function PurchasesTable({
  purchases,
  prices,
  onEdit,
  onDelete
}: PurchasesTableProps) {
  if (purchases.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
        No purchases yet. Click <span className="font-medium">Add</span> to log
        your first one.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Tanggal Pembelian</TableHead>
            <TableHead className="text-center">Kode Saham</TableHead>
            <TableHead className="text-center">Harga Beli</TableHead>
            <TableHead className="text-center">Jumlah Lot</TableHead>
            <TableHead className="text-center">Harga Terakhir</TableHead>
            <TableHead className="text-center">Nilai Investasi</TableHead>
            <TableHead className="text-center">Nilai Saat Ini</TableHead>
            <TableHead className="text-center">Kenaikan/Penurunan</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((p) => {
            const last = prices[`${p.code}.JK`]
            const invested = p.price * p.lots * SHARES_PER_LOT
            const currentValue =
              last !== undefined ? last * p.lots * SHARES_PER_LOT : 0
            const pct =
              last !== undefined && p.price > 0
                ? ((last - p.price) / p.price) * 100
                : null

            return (
              <TableRow key={p.id}>
                <TableCell className="text-center">
                  {formatDateDisplay(p.date)}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {p.code}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(p.price)}
                </TableCell>
                <TableCell className="text-center">{p.lots}</TableCell>
                <TableCell className="text-center">
                  {last !== undefined ? formatNumber(last) : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(invested)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(currentValue)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-center',
                    pct === null && 'text-muted-foreground',
                    pct !== null &&
                      pct > 0 &&
                      'text-green-600 dark:text-green-400',
                    pct !== null && pct < 0 && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {pct === null ? '—' : formatPercentage(pct)}
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(p)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(p)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
