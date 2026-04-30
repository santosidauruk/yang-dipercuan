'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import type { Recommendation, SignalType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star } from 'lucide-react'
import Link from 'next/link'

export const SIGNALS: SignalType[] = ['buy', 'sell', 'hold']
export const signalColors: Record<string, string> = {
  buy: 'bg-green-600/10 text-green-600 dark:text-green-400',
  sell: 'bg-red-600/10 text-red-600 dark:text-red-400',
  hold: 'bg-amber-600/10 text-amber-600 dark:text-amber-400'
}

export function RecommendationWidget() {
  const { data: recommendations, isLoading } = useQuery<Recommendation[]>({
    queryKey: ['recommendations'],
    queryFn: () => fetchApi('/api/recommendations')
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  const topPicks = recommendations?.slice(0, 3) ?? []

  return (
    <Link href="/recommendations">
      <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4" />
            Top Picks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topPicks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No recommendations yet.
            </p>
          ) : (
            topPicks.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">
                    {rec.stockCode.replace('.JK', '')}
                  </span>
                  <Badge
                    variant="secondary"
                    className={signalColors[rec.signal]}
                  >
                    {rec.signal.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-muted-foreground font-mono">
                  {rec.score}/100
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
