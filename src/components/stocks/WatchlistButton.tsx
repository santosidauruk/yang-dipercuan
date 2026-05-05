'use client'

import { Button } from '@/components/ui/button'
import { useWatchlist } from '@/stores/useWatchlist'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface WatchlistButtonProps {
  stockCode: string
}

const bareCode = (code: string) => code.replace(/\.JK$/i, '')

export function WatchlistButton({ stockCode }: WatchlistButtonProps) {
  const code = bareCode(stockCode)
  const has = useWatchlist((s) => s.has(code))
  const addItem = useWatchlist((s) => s.addItem)
  const removeItem = useWatchlist((s) => s.removeItem)

  const toggle = () => {
    if (has) {
      removeItem(code)
      toast.success(`${code} removed from watchlist`)
    } else {
      addItem(code)
      toast.success(`${code} added to watchlist`)
    }
  }

  return (
    <Button variant={has ? 'default' : 'outline'} size="sm" onClick={toggle}>
      <Star className={`mr-1 h-4 w-4 ${has ? 'fill-current' : ''}`} />
      {has ? 'Watching' : 'Watch'}
    </Button>
  )
}
