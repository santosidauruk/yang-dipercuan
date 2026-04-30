'use client'
import { RecommendationsFilter } from '@/components/recommendations/RecommendationFilter'
import { RecommendationsList } from '@/components/recommendations/RecommendationsList'
import { SignalType } from '@/types'
import { useState } from 'react'

export default function RecommendationsPage() {
  const [signal, setSignal] = useState<SignalType | undefined>(undefined)
  const [sector, setSector] = useState<string | undefined>(undefined)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Recommendations</h1>
      <RecommendationsFilter
        signal={signal}
        sector={sector}
        onSectorFilter={setSector}
        onSignalFilter={setSignal}
      />
      <RecommendationsList signal={signal} sector={sector} />
    </div>
  )
}
