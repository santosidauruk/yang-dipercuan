'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PortfolioWidget } from '@/components/dashboard/PortfolioWidget'
import { RecommendationWidget } from '@/components/dashboard/RecommendationWidget'
import { MarketOverview } from '@/components/dashboard/MarketOverview'

// Uncomment once you build WatchlistWidget:
import { WatchlistWidget } from '@/components/dashboard/WatchlistWidget'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-muted-foreground text-sm">
          Here&apos;s your market overview
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MarketOverview />
        <PortfolioWidget />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RecommendationWidget />

        {/**
         * YOUR TASK: Build WatchlistWidget.tsx and uncomment the import above.
         * Then replace this placeholder:
         */}
        <WatchlistWidget />
      </div>
    </div>
  )
}
