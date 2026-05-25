import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PurchasesPageClient } from './PurchasesPageClient'
import { usePurchases } from '@/stores/usePurchases'
import { useSales } from '@/stores/useSales'
import { useDividends } from '@/stores/useDividends'

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
  useDividends.setState({ dividends: [] })
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

describe('PurchasesPageClient cascade-delete preview', () => {
  async function setupAndClickDelete() {
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
          lots: 3,
          price: 9500,
          costBasis: 9000
        },
        {
          id: 's2',
          code: 'BBCA',
          date: '2026-03-01',
          lots: 2,
          price: 9700,
          costBasis: 9000
        }
      ]
    })
    useDividends.setState({
      dividends: [{ id: 'd1', code: 'BBCA', date: '2026-04-01', dps: 50 }]
    })

    renderWithQuery(<PurchasesPageClient />)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    return user
  }

  it('opens preview dialog showing dependent counts', async () => {
    await setupAndClickDelete()

    expect(
      await screen.findByRole('heading', { name: /delete purchase/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/2 sales/i)).toBeInTheDocument()
    expect(screen.getByText(/1 dividend/i)).toBeInTheDocument()
    expect(usePurchases.getState().purchases).toHaveLength(1)
  })

  it('removes only the purchase on confirm, leaves dependents intact', async () => {
    const user = await setupAndClickDelete()

    await screen.findByRole('heading', { name: /delete purchase/i })
    await user.click(
      screen.getByRole('button', { name: /^delete$/i, hidden: false })
    )

    await waitFor(() =>
      expect(usePurchases.getState().purchases).toHaveLength(0)
    )
    expect(useSales.getState().sales).toHaveLength(2)
    expect(useDividends.getState().dividends).toHaveLength(1)
  })

  it('keeps purchase when user cancels', async () => {
    const user = await setupAndClickDelete()

    await screen.findByRole('heading', { name: /delete purchase/i })
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: /delete purchase/i })
      ).not.toBeInTheDocument()
    )
    expect(usePurchases.getState().purchases).toHaveLength(1)
  })
})

describe('PurchasesPageClient CSV import', () => {
  it('appends valid rows to the store', async () => {
    const user = userEvent.setup()
    renderWithQuery(<PurchasesPageClient />)

    const file = new File(
      ['id,date,code,price,lots\np1,2026-01-01,BBCA,9000,5\n'],
      'purchases.csv',
      { type: 'text/csv' }
    )
    const input = screen.getByTestId('csv-import-input') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() =>
      expect(usePurchases.getState().purchases).toHaveLength(1)
    )
    expect(usePurchases.getState().purchases[0]).toMatchObject({
      id: 'p1',
      code: 'BBCA',
      price: 9000,
      lots: 5
    })
  })

  it('shows error dialog and inserts nothing when any row is invalid', async () => {
    const user = userEvent.setup()
    renderWithQuery(<PurchasesPageClient />)

    const file = new File(
      [
        'id,date,code,price,lots\n' +
          'p1,2026-01-01,BBCA,9000,5\n' +
          'p2,bad-date,BBCA,9000,5\n'
      ],
      'purchases.csv',
      { type: 'text/csv' }
    )
    const input = screen.getByTestId('csv-import-input') as HTMLInputElement
    await user.upload(input, file)

    expect(
      await screen.findByRole('heading', { name: /import failed/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/row 3/i)).toBeInTheDocument()
    expect(usePurchases.getState().purchases).toHaveLength(0)
  })
})
