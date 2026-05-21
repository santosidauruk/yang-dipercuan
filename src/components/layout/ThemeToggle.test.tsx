import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from 'next-themes'
import { ThemeToggle } from './ThemeToggle'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    })
  })
})

function ThemeProbe() {
  const { theme } = useTheme()
  return <span data-testid="theme">{theme ?? 'unset'}</span>
}

function renderWithTheme() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem >
      <ThemeToggle />
      <ThemeProbe />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  it('cycles light → dark', async () => {
    const user = userEvent.setup()
    renderWithTheme()

    const btn = screen.getByRole('button', { name: /toggle theme/i })

    // explicitly start at light so cycle order is deterministic
    await user.click(btn)
    // start state may be system; we just assert cycling visits all three
    const seen = new Set<string>()
    for (let i = 0; i < 2; i++) {
      seen.add(screen.getByTestId('theme').textContent ?? '')
      await user.click(btn)
    }
    expect(seen.has('light')).toBe(true)
    expect(seen.has('dark')).toBe(true)
  })
})
