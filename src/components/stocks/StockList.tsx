'use client'

import { useStocks } from '@/hooks/useStocks'
import { formatCurrency, formatCompactNumber } from '@/lib/utils'
import { PriceChange } from '@/components/common/PriceChange'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import Link from 'next/link'

interface StockListProps {
  sector?: string
}

export function StockList({ sector }: StockListProps) {
  const { data: stocks, isLoading, error } = useStocks(sector)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Failed to load stock data. Please try again later.
      </div>
    )
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No stocks found.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Market Cap</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow
              key={stock.code}
              className="hover:bg-accent relative cursor-pointer"
            >
              <TableCell>
                {stock.code.replace('.JK', '')}
                <Link
                  href={`/stocks/${stock.code.replace('.JK', '')}`}
                  className="text-primary absolute inset-0 block font-mono font-semibold hover:underline"
                ></Link>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {stock.name}
              </TableCell>
              <TableCell>
                <span className="bg-secondary rounded px-2 py-0.5 text-xs">
                  {stock.sector}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(stock.price)}
              </TableCell>
              <TableCell className="text-right">
                <PriceChange
                  value={stock.change}
                  percentage={stock.changePercent}
                  showValue={false}
                />
              </TableCell>
              <TableCell className="text-muted-foreground text-right font-mono">
                {formatCompactNumber(stock.volume)}
              </TableCell>
              <TableCell className="text-muted-foreground text-right font-mono">
                {formatCompactNumber(stock.marketCap)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
