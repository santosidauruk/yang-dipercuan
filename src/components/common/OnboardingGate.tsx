'use client'

import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { usePurchases } from '@/stores/usePurchases'
import { useSettings } from '@/stores/useSettings'

export function OnboardingGate() {
  const purchases = usePurchases((s) => s.purchases)
  const onboardingDismissed = useSettings((s) => s.onboardingDismissed)
  const dismissOnboarding = useSettings((s) => s.dismissOnboarding)

  const open = purchases.length === 0 && !onboardingDismissed

  const handleOpenChange = (next: boolean) => {
    if (!next) dismissOnboarding()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Granary</DialogTitle>
          <DialogDescription>
            Track your IDX portfolio locally. No backend, no signup — all data
            lives in this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="text-muted-foreground text-sm">
          Start by logging your first buy.
        </div>
        <DialogFooter>
          <Button asChild>
            <Link href="/purchases" onClick={dismissOnboarding}>
              Add transactions manually
            </Link>
          </Button>
          <Button variant="outline" onClick={dismissOnboarding}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
