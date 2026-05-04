'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  ShoppingCart,
  Receipt,
  Coins,
  Star
} from 'lucide-react'

const navItems = [
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/sales', label: 'Sales', icon: Receipt },
  { href: '/dividends', label: 'Dividends', icon: Coins },
  { href: '/watchlist', label: 'Watchlist', icon: Star }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-primary-foreground fixed right-0 bottom-0 left-0 z-50 mx-auto flex max-w-xl flex-1 justify-between space-y-1 px-2">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
          </Link>
        )
      })}
    </nav>
  )
}
