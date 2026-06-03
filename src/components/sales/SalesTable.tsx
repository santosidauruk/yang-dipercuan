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
import { formatPercentage, cn, formatNumber, formatCurrency } from '@/lib/utils'
import { formatDateDisplay } from '@/lib/date'
import type { Sale } from '@/types'

interface SalesTableProps {
  sales: Sale[]
  onEdit: (sale: Sale) => void
  onDelete: (sale: Sale) => void
}

const SHARES_PER_LOT = 100

export function SalesTable({ sales, onEdit, onDelete }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
        No sales yet. Click <span className="font-medium">Add</span> to record
        your first sale.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Tanggal Penjualan</TableHead>
            <TableHead className="text-center">Kode Saham</TableHead>
            <TableHead className="text-right">Cost Basis</TableHead>
            <TableHead className="text-right">Lots</TableHead>
            <TableHead className="text-right">Purchase Value</TableHead>
            <TableHead className="text-center">Harga Penjualan</TableHead>
            <TableHead className="text-center">Nilai Penjualan</TableHead>
            <TableHead className="text-center">Kenaikan/Penurunan</TableHead>
            <TableHead className="text-center">Keuntungan/Kerugian</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((s) => {
            const shares = s.lots * SHARES_PER_LOT
            const purchaseValue = s.costBasis * shares
            const sellValue = s.price * shares
            const capitalGain = (s.price - s.costBasis) * shares
            const pct =
              s.costBasis > 0
                ? ((s.price - s.costBasis) / s.costBasis) * 100
                : null
            return (
              <TableRow key={s.id}>
                <TableCell className="text-center">{formatDateDisplay(s.date)}</TableCell>
                <TableCell className="text-center font-medium">{s.code}</TableCell>
                <TableCell className="text-center">
                  {formatCurrency(s.costBasis)}
                </TableCell>
                <TableCell className="text-center">{s.lots}</TableCell>
                <TableCell className="text-center">
                  {formatCurrency(purchaseValue)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(s.price)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(sellValue)}
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
                <TableCell
                  className={cn(
                    'text-center',
                    capitalGain > 0 && 'text-green-600 dark:text-green-400',
                    capitalGain < 0 && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {formatCurrency(capitalGain)}
                </TableCell>
                  <TableCell className="text-center">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(s)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(s)}
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
