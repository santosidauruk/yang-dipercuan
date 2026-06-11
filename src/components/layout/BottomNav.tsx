'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Briefcase, ShoppingBag, ArrowUpDown, Coins, Star } from 'lucide-react'

const navItems = [
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/purchases', label: 'Buy', icon: ShoppingBag },
  { href: '/sales', label: 'Sell', icon: ArrowUpDown },
  { href: '/dividends', label: 'Dividends', icon: Coins },
  { href: '/watchlist', label: 'Watchlist', icon: Star }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed right-0 bottom-0 left-0 z-50 mx-auto flex max-w-xl justify-between border-t px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur"
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] leading-none transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
