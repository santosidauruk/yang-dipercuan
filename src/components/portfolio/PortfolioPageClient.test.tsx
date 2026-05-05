import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePurchases } from '@/stores/usePurchases'
import { useSales } from '@/stores/useSales'
import { useDividends } from '@/stores/useDividends'
import { useStockMeta } from '@/stores/useStockMeta'
import { PortfolioPageClient } from './PortfolioPageClient'

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <PortfolioPageClient />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

const fetchMock = vi.fn()

beforeEach(() => {
  localStorage.clear()
  usePurchases.setState({ purchases: [] })
  useSales.setState({ sales: [] })
  useDividends.setState({ dividends: [] })
  useStockMeta.setState({ meta: {} })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PortfolioPageClient', () => {
  it('shows zeros and empty state when stores are empty', async () => {
    renderPage()

    expect(screen.getByText(/total invested/i)).toBeInTheDocument()
    expect(screen.getByText(/net capital change/i)).toBeInTheDocument()
    expect(
      screen.getByText(/no holdings yet/i)
    ).toBeInTheDocument()
  })

  it('renders summary numbers and a holdings row from seeded stores', async () => {
    usePurchases.setState({
      purchases: [
        {
          id: 'p1',
          code: 'BBCA',
          date: '2026-01-01',
          lots: 10,
          price: 9000
        }
      ]
    })
    useStockMeta.setState({
      meta: { BBCA: { name: 'Bank Central Asia Tbk', sector: 'Financial Services' } }
    })

    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/stocks/prices')) {
        return Promise.resolve(
          new Response(JSON.stringify({ 'BBCA.JK': 11000 }), { status: 200 })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderPage()

    const row = await screen.findByRole('row', { name: /BBCA/ })
    expect(within(row).getByText('10')).toBeInTheDocument() // lots

    await waitFor(() => {
      const summary = screen.getByTestId('summary-net-capital-change')
      // (11000-9000)*1000 = 2,000,000
      expect(summary.textContent).toMatch(/2\.000\.000/)
    })
  })

  it('allocation donut legend toggles between issuer and sector', async () => {
    usePurchases.setState({
      purchases: [
        { id: 'p1', code: 'BBCA', date: '2026-01-01', lots: 5, price: 9000 },
        { id: 'p2', code: 'BMRI', date: '2026-01-01', lots: 5, price: 5000 }
      ]
    })
    useStockMeta.setState({
      meta: {
        BBCA: { name: 'Bank Central Asia', sector: 'Financial Services' },
        BMRI: { name: 'Bank Mandiri', sector: 'Financial Services' }
      }
    })
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/stocks/prices')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ 'BBCA.JK': 10000, 'BMRI.JK': 6000 }),
            { status: 200 }
          )
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderPage()

    const legend = await screen.findByTestId('allocation-legend')

    // default: issuer mode
    await waitFor(() => {
      expect(within(legend).getByText('BBCA')).toBeInTheDocument()
      expect(within(legend).getByText('BMRI')).toBeInTheDocument()
    })

    // toggle to sector
    await userEvent.click(screen.getByRole('button', { name: /sector/i }))

    await waitFor(() => {
      expect(
        within(legend).getByText('Financial Services')
      ).toBeInTheDocument()
      expect(within(legend).queryByText('BBCA')).not.toBeInTheDocument()
    })
  })

  it('clicking a holdings row expands drill-down with purchases, sales, dividends', async () => {
    usePurchases.setState({
      purchases: [
        { id: 'p1', code: 'BBCA', date: '2026-01-01', lots: 10, price: 9000 },
        { id: 'p2', code: 'BBCA', date: '2026-02-01', lots: 5, price: 9500 }
      ]
    })
    useSales.setState({
      sales: [
        {
          id: 's1',
          code: 'BBCA',
          date: '2026-03-01',
          lots: 3,
          price: 10000,
          costBasis: 9000
        }
      ]
    })
    useDividends.setState({
      dividends: [{ id: 'd1', code: 'BBCA', date: '2026-04-01', dps: 50 }]
    })
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/stocks/prices')) {
        return Promise.resolve(
          new Response(JSON.stringify({ 'BBCA.JK': 10500 }), { status: 200 })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderPage()

    const row = await screen.findByRole('row', { name: /BBCA/ })
    await userEvent.click(row)

    const drill = await screen.findByTestId('drilldown-BBCA')
    expect(within(drill).getByText(/2026-01-01/)).toBeInTheDocument()
    expect(within(drill).getByText(/2026-02-01/)).toBeInTheDocument()
    expect(within(drill).getByText(/2026-03-01/)).toBeInTheDocument()
    expect(within(drill).getByText(/2026-04-01/)).toBeInTheDocument()
  })
})
