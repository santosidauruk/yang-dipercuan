'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useStockSearch, useStocksQuotes } from '@/hooks/useStocks'
import { useWatchlist } from '@/stores/useWatchlist'
import { useStockMeta } from '@/stores/useStockMeta'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'

const bareCode = (code: string) => code.replace(/\.JK$/i, '')

export function WatchlistPageClient() {
  const items = useWatchlist((s) => s.items)
  const addItem = useWatchlist((s) => s.addItem)
  const removeItem = useWatchlist((s) => s.removeItem)
  const setMeta = useStockMeta((s) => s.setMeta)
  const meta = useStockMeta((s) => s.meta)

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { data: results = [], isFetching } = useStockSearch(debounced)
  const visible = results.slice(0, 8)

  const symbols = useMemo(() => items.map((i) => `${i.code}.JK`), [items])
  const { data: quotes = {} } = useStocksQuotes(symbols)

  const handleSelect = (
    yahooCode: string,
    name: string,
    sector: string
  ) => {
    const code = bareCode(yahooCode)
    addItem(code)
    setMeta(code, { name, sector })
    setQuery('')
    setDebounced('')
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Watchlist</h1>

      <div ref={containerRef} className="relative">
        <Input
          placeholder="Search Indonesian stocks (e.g. BBCA)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {open && debounced.length > 0 && (
          <div className="bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md">
            {isFetching && (
              <div className="text-muted-foreground p-2 text-sm">Searching…</div>
            )}
            {!isFetching && visible.length === 0 && (
              <div className="text-muted-foreground p-2 text-sm">No matches</div>
            )}
            {visible.map((r) => (
              <button
                key={r.code}
                type="button"
                className="hover:bg-accent flex w-full flex-col items-start gap-0.5 p-2 text-left text-sm"
                onClick={() => handleSelect(r.code, r.name, r.sector ?? '')}
              >
                <span className="font-medium">{bareCode(r.code)}</span>
                <span className="text-muted-foreground text-xs">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
          Search for a stock to add it to your watchlist.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Last Price</TableHead>
                <TableHead className="text-right">%Δ today</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const quote = quotes[`${item.code}.JK`]
                const price = quote?.price
                const pct = quote?.changePercent
                return (
                  <TableRow
                    key={item.code}
                    data-testid={`watchlist-row-${item.code}`}
                  >
                    <TableCell>
                      <Link
                        href={`/stocks/${item.code}`}
                        className="font-medium hover:underline"
                      >
                        {item.code}
                      </Link>
                    </TableCell>
                    <TableCell>{meta[item.code]?.name ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {price !== undefined ? formatCurrency(price) : '—'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right',
                        pct !== undefined &&
                          (pct >= 0 ? 'text-green-600' : 'text-red-600')
                      )}
                    >
                      {pct !== undefined ? formatPercentage(pct) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`remove-${item.code}`}
                        onClick={() => removeItem(item.code)}
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
      )}
    </div>
  )
}
