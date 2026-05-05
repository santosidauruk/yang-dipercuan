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
import { formatCompactNumber, formatPercentage, cn } from '@/lib/utils'
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
            <TableHead>Sale Date</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="text-right">Cost Basis</TableHead>
            <TableHead className="text-right">Lots</TableHead>
            <TableHead className="text-right">Purchase Value</TableHead>
            <TableHead className="text-right">Sell Price</TableHead>
            <TableHead className="text-right">Sell Value</TableHead>
            <TableHead className="text-right">%Δ</TableHead>
            <TableHead className="text-right">Capital Gain</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                <TableCell>{formatDateDisplay(s.date)}</TableCell>
                <TableCell className="font-medium">{s.code}</TableCell>
                <TableCell className="text-right">
                  {formatCompactNumber(s.costBasis)}
                </TableCell>
                <TableCell className="text-right">{s.lots}</TableCell>
                <TableCell className="text-right">
                  {formatCompactNumber(purchaseValue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCompactNumber(s.price)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCompactNumber(sellValue)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right',
                    pct === null && 'text-muted-foreground',
                    pct !== null && pct > 0 && 'text-green-600 dark:text-green-400',
                    pct !== null && pct < 0 && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {pct === null ? '—' : formatPercentage(pct)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right',
                    capitalGain > 0 && 'text-green-600 dark:text-green-400',
                    capitalGain < 0 && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {formatCompactNumber(capitalGain)}
                </TableCell>
                <TableCell className="text-right">
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
