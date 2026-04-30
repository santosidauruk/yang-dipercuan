import { useRecommendations } from '@/hooks/useRecommendations'
import { Skeleton } from '../ui/skeleton'
import { SignalType } from '@/types'
import { DailyPickCard } from './DailyPickCard'

interface Props {
  signal?: SignalType
  sector?: string
}

export function RecommendationsList({ signal, sector }: Props) {
  const {
    data: recommendations,
    isLoading,
    error
  } = useRecommendations(signal, sector)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
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

  if (!recommendations || recommendations.length === 0) {
    return <div>No recommendation at the moment</div>
  }

  return (
    <ul className="flex flex-col gap-y-4">
      {recommendations.map((r) => {
        return <DailyPickCard data={r} key={r.stockCode} />
      })}
    </ul>
  )
}
