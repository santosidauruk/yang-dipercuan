'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  const handleSelect = (yahooCode: string, name: string, sector: string) => {
    const code = bareCode(yahooCode)
    addItem(code)
    setMeta(code, { name, sector })
    setQuery('')
    setDebounced('')
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Follow IDX symbols with live price changes.
        </p>
      </div>

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
              <div className="text-muted-foreground p-2 text-sm">
                Searching…
              </div>
            )}
            {!isFetching && visible.length === 0 && (
              <div className="text-muted-foreground p-2 text-sm">
                No matches
              </div>
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
        <div className="border-border/70 bg-card/70 text-muted-foreground rounded-lg border p-8 text-center text-sm">
          <p className="text-foreground font-medium">
            Your watchlist is empty.
          </p>
          <p className="mt-1">
            Search for a stock to add it to your watchlist.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const quote = quotes[`${item.code}.JK`]
            const price = quote?.price
            const pct = quote?.changePercent
            return (
              <article
                key={item.code}
                data-testid={`watchlist-row-${item.code}`}
                className="border-border/70 bg-card/80 rounded-lg border p-4 shadow-sm shadow-black/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/stocks/${item.code}`}
                      className="text-xl font-semibold tracking-tight hover:underline"
                    >
                      {item.code}
                    </Link>
                    <p className="text-muted-foreground truncate text-sm">
                      {meta[item.code]?.name ?? '-'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="text-red-500 hover:text-red-500"
                    data-testid={`remove-${item.code}`}
                    onClick={() => removeItem(item.code)}
                    aria-label={`Remove ${item.code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-medium tabular-nums">
                      {price !== undefined ? formatCurrency(price) : '-'}
                    </p>
                    <p className="text-muted-foreground text-sm">Last price</p>
                  </div>
                  <div
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums',
                      pct === undefined && 'text-muted-foreground',
                      pct !== undefined &&
                        pct >= 0 &&
                        'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                      pct !== undefined &&
                        pct < 0 &&
                        'border-red-500/30 bg-red-500/10 text-red-500'
                    )}
                  >
                    {pct !== undefined ? formatPercentage(pct) : '-'}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
