import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SalesPageClient } from './SalesPageClient'
import { usePurchases } from '@/stores/usePurchases'
import { useSales } from '@/stores/useSales'

function renderWithQuery(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const fetchMock = vi.fn()

beforeEach(() => {
  localStorage.clear()
  usePurchases.setState({ purchases: [] })
  useSales.setState({ sales: [] })
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => []
  } as Response)
  vi.stubGlobal('fetch', fetchMock)
})

async function submitOversoldSale() {
  const user = userEvent.setup()
  usePurchases.setState({
    purchases: [
      { id: 'p1', code: 'BBCA', date: '2026-01-01', lots: 10, price: 9000 }
    ]
  })

  renderWithQuery(<SalesPageClient />)

  await user.click(screen.getByRole('button', { name: /add/i }))

  const codeInput = await screen.findByPlaceholderText('BBCA')
  await user.type(codeInput, 'BBCA')

  const inputs = screen.getAllByRole('spinbutton')
  // price, lots, costBasis
  await user.type(inputs[0], '9500')
  await user.type(inputs[1], '15')
  await user.type(inputs[2], '9000')

  await user.click(screen.getByRole('button', { name: 'Add' }))

  return user
}

describe('SalesPageClient soft-warn on oversold sale', () => {
  it('opens SoftWarnDialog instead of saving when lots > held', async () => {
    await submitOversoldSale()

    expect(
      await screen.findByRole('heading', { name: /selling more than you hold/i })
    ).toBeInTheDocument()
    expect(useSales.getState().sales).toHaveLength(0)
  })

  it('persists sale when user clicks Continue', async () => {
    const user = await submitOversoldSale()

    await screen.findByRole('heading', { name: /selling more than you hold/i })
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() =>
      expect(useSales.getState().sales).toHaveLength(1)
    )
    expect(useSales.getState().sales[0]).toMatchObject({
      code: 'BBCA',
      lots: 15
    })
  })

  it('does NOT persist sale when user clicks Cancel', async () => {
    const user = await submitOversoldSale()

    await screen.findByRole('heading', { name: /selling more than you hold/i })
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: /selling more than you hold/i })
      ).not.toBeInTheDocument()
    )
    expect(useSales.getState().sales).toHaveLength(0)
  })
})
