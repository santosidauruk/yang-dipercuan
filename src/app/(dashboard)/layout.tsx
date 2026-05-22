import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { OnboardingGate } from '@/components/common/OnboardingGate'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col">
      <Header />
      <div className="relative flex flex-1">
        <main className="flex-1 overflow-auto p-4 pb-10 md:p-6 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </div>
      <OnboardingGate />
    </div>
  )
}
