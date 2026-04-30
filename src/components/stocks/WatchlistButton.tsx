'use client'

import { Button } from '@/components/ui/button'
import { useWatchlistStore } from '@/stores/useWatchlistStore'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface WatchlistButtonProps {
  stockCode: string
}

export function WatchlistButton({ stockCode }: WatchlistButtonProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } =
    useWatchlistStore()
  const isWatched = isInWatchlist(stockCode)

  const toggle = () => {
    if (isWatched) {
      removeFromWatchlist(stockCode)
      toast.success(`${stockCode.replace('.JK', '')} removed from watchlist`)
    } else {
      addToWatchlist(stockCode)
      toast.success(`${stockCode.replace('.JK', '')} added to watchlist`)
    }
  }

  return (
    <Button
      variant={isWatched ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
    >
      <Star className={`mr-1 h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
      {isWatched ? 'Watching' : 'Watch'}
    </Button>
  )
}
