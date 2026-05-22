import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingGate } from './OnboardingGate'
import { usePurchases } from '@/stores/usePurchases'
import { useSettings } from '@/stores/useSettings'

beforeEach(() => {
  localStorage.clear()
  usePurchases.setState({ purchases: [] })
  useSettings.setState({ onboardingDismissed: false })
})

describe('OnboardingGate', () => {
  it('shows modal when purchases empty and not dismissed', () => {
    render(<OnboardingGate />)
    expect(
      screen.getByRole('heading', { name: /welcome/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add transactions manually/i }))
      .toHaveAttribute('href', '/purchases')
  })

  it('does NOT show modal when a purchase exists', () => {
    usePurchases.setState({
      purchases: [
        { id: 'p1', code: 'BBCA', date: '2026-01-01', lots: 1, price: 9000 }
      ]
    })
    render(<OnboardingGate />)
    expect(
      screen.queryByRole('heading', { name: /welcome/i })
    ).not.toBeInTheDocument()
  })

  it('does NOT show modal when dismissed', () => {
    useSettings.setState({ onboardingDismissed: true })
    render(<OnboardingGate />)
    expect(
      screen.queryByRole('heading', { name: /welcome/i })
    ).not.toBeInTheDocument()
  })

  it('dismiss button persists dismissal and closes modal', async () => {
    const user = userEvent.setup()
    render(<OnboardingGate />)

    await user.click(screen.getByRole('button', { name: /got it/i }))

    expect(useSettings.getState().onboardingDismissed).toBe(true)
    expect(
      screen.queryByRole('heading', { name: /welcome/i })
    ).not.toBeInTheDocument()
  })
})
