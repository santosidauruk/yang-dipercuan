'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { StockList } from '@/components/stocks/StockList'
import { SectorFilter } from '@/components/stocks/SectorFilter'
import { useStockSearch } from '@/hooks/useStocks'
import { Search } from 'lucide-react'
import Link from 'next/link'

export default function StocksPage() {
  const [sector, setSector] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: searchResults } = useStockSearch(searchQuery)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Stocks</h1>
        <p className="text-muted-foreground text-sm">
          Browse and search IDX stocks
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by stock code or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {searchQuery.length >= 1 &&
          searchResults &&
          searchResults.length > 0 && (
            <div className="bg-popover absolute z-50 mt-1 w-full rounded-md border p-1 shadow-md">
              {searchResults.map((result) => (
                <Link
                  key={result.code}
                  href={`/stocks/${result.code.replace('.JK', '')}`}
                  className="hover:bg-accent flex items-center justify-between rounded-sm px-3 py-2 text-sm"
                  onClick={() => setSearchQuery('')}
                >
                  <div>
                    <span className="font-mono font-semibold">
                      {result.code.replace('.JK', '')}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {result.name}
                    </span>
                  </div>
                  {result.sector && (
                    <span className="bg-secondary rounded px-2 py-0.5 text-xs">
                      {result.sector}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
      </div>

      {/* Sector Filter — YOU will build this as SectorFilter.tsx component */}
      {/* For now, inline buttons as a placeholder you can reference */}
      <SectorFilter sector={sector} onSectorChange={setSector} />

      {/* Stock List */}
      <StockList sector={sector} />
    </div>
  )
}
