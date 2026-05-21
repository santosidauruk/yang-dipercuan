import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PurchasesPageClient } from './PurchasesPageClient'
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
  fetchMock.mockImplementation(async (url: string) => {
    const isPrices = url.includes('/api/stocks/prices')
    return {
      ok: true,
      json: async () => (isPrices ? {} : [])
    } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
})

async function openEditAndReduceLots() {
  const user = userEvent.setup()
  usePurchases.setState({
    purchases: [
      { id: 'p1', code: 'BBCA', date: '2026-01-01', lots: 10, price: 9000 }
    ]
  })
  useSales.setState({
    sales: [
      {
        id: 's1',
        code: 'BBCA',
        date: '2026-02-01',
        lots: 7,
        price: 9500,
        costBasis: 9000
      }
    ]
  })

  renderWithQuery(<PurchasesPageClient />)

  await user.click(screen.getByRole('button', { name: /^edit$/i }))

  const lotsInputs = screen.getAllByRole('spinbutton')
  // price, lots
  await user.clear(lotsInputs[1])
  await user.type(lotsInputs[1], '5')

  await user.click(screen.getByRole('button', { name: 'Save' }))
  return user
}

describe('PurchasesPageClient soft-warn on edit causing negative downstream qty', () => {
  it('opens SoftWarnDialog instead of saving when edit makes sale invalid', async () => {
    await openEditAndReduceLots()

    expect(
      await screen.findByRole('heading', { name: /negative downstream/i })
    ).toBeInTheDocument()
    expect(usePurchases.getState().purchases[0].lots).toBe(10)
  })

  it('applies edit when user clicks Continue', async () => {
    const user = await openEditAndReduceLots()

    await screen.findByRole('heading', { name: /negative downstream/i })
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() =>
      expect(usePurchases.getState().purchases[0].lots).toBe(5)
    )
  })

  it('does NOT apply edit when user clicks Cancel', async () => {
    const user = await openEditAndReduceLots()

    await screen.findByRole('heading', { name: /negative downstream/i })
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: /negative downstream/i })
      ).not.toBeInTheDocument()
    )
    expect(usePurchases.getState().purchases[0].lots).toBe(10)
  })

  it('reopens PurchaseFormDialog with edited values when Cancel clicked', async () => {
    const user = await openEditAndReduceLots()

    await screen.findByRole('heading', { name: /negative downstream/i })
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(
      await screen.findByRole('heading', { name: /edit purchase/i })
    ).toBeInTheDocument()

    const inputs = screen.getAllByRole('spinbutton')
    // price, lots
    expect((inputs[1] as HTMLInputElement).value).toBe('5')
    expect((inputs[0] as HTMLInputElement).value).toBe('9000')
    expect(
      (screen.getByPlaceholderText('BBCA') as HTMLInputElement).value
    ).toBe('BBCA')
  })

  it('does NOT reopen edit form when SoftWarn dismissed via Escape', async () => {
    const user = await openEditAndReduceLots()

    await screen.findByRole('heading', { name: /negative downstream/i })
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: /negative downstream/i })
      ).not.toBeInTheDocument()
    )
    expect(
      screen.queryByRole('heading', { name: /edit purchase/i })
    ).not.toBeInTheDocument()
    expect(usePurchases.getState().purchases[0].lots).toBe(10)
  })
})
