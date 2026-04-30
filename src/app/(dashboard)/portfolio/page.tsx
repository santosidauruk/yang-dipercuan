'use client'

import { useState } from 'react'
import { usePortfolioWithMarket } from '@/hooks/usePortfolio'
import { HoldingWithMarket } from '@/types'
import { Button } from '@/components/ui/button'
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary'
import { Holdings } from '@/components/portfolio/Holdings'
import { HoldingForm } from '@/components/portfolio/HoldingForm'
import { AllocationChart } from '@/components/portfolio/AllocationChart'
import { PerformanceVsIhsg } from '@/components/portfolio/PerformanceVsIhsg'

export default function PortfolioPage() {
  const { data: portfolio, isPending: isPendingPortfolio } = usePortfolioWithMarket()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HoldingWithMarket | undefined>()

  function openAdd() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(h: HoldingWithMarket) {
    setEditing(h)
    setFormOpen(true)
  }

  const holdings = portfolio ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <Button onClick={openAdd}>Add Holding</Button>
      </div>

      <PortfolioSummary portfolio={holdings} />

      <Holdings holdings={holdings} onEdit={openEdit} />

      <AllocationChart holdings={holdings} isLoading={isPendingPortfolio} />
      <PerformanceVsIhsg />

      <HoldingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        holding={editing}
      />
    </div>
  )
}
