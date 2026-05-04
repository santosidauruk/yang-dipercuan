'use client'

import { useEffect, useRef, useState } from 'react'
import { useStockSearch } from '@/hooks/useStocks'
import { Input } from '@/components/ui/input'

interface CodeAutocompleteProps {
  value: string
  onChange: (code: string) => void
  placeholder?: string
}

export function CodeAutocomplete({
  value,
  onChange,
  placeholder = 'BBCA'
}: CodeAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [debounced, setDebounced] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setQuery(value)
  }, [value])

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

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value.toUpperCase()
          setQuery(next)
          onChange(next.replace(/\.JK$/i, ''))
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
          {visible.map((r) => {
            const bare = r.code.replace(/\.JK$/i, '')
            return (
              <button
                key={r.code}
                type="button"
                className="hover:bg-accent flex w-full flex-col items-start gap-0.5 p-2 text-left text-sm"
                onClick={() => {
                  setQuery(bare)
                  onChange(bare)
                  setOpen(false)
                }}
              >
                <span className="font-medium">{bare}</span>
                <span className="text-muted-foreground text-xs">{r.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
