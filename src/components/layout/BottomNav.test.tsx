import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav } from './BottomNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/purchases'
}))

describe('BottomNav', () => {
  it('shows readable labels and marks the active route', () => {
    render(<BottomNav />)

    for (const label of [
      'Portfolio',
      'Buy',
      'Sell',
      'Dividends',
      'Watchlist'
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }

    expect(screen.getByRole('link', { name: 'Buy' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })
})
