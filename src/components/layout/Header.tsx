'use client'

import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { TrendingUp } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex h-14 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <TrendingUp className="text-primary h-5 w-5" />
          <span>StockIDX</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
