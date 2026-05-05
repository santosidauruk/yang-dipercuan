import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WatchlistPageClient } from './WatchlistPageClient'
import { useWatchlist } from '@/stores/useWatchlist'
import { useStockMeta } from '@/stores/useStockMeta'

function renderWithQuery(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const fetchMock = vi.fn()

function setFetchHandler(
  handler: (url: string) => unknown | Promise<unknown>
) {
  fetchMock.mockImplementation(async (url: string) => {
    const data = await handler(url)
    return {
      ok: true,
      json: async () => data
    } as Response
  })
}

beforeEach(() => {
  localStorage.clear()
  useWatchlist.setState({ items: [] })
  useStockMeta.setState({ meta: {} })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('WatchlistPageClient', () => {
  it('renders empty state when watchlist is empty', () => {
    setFetchHandler(() => [])
    renderWithQuery(<WatchlistPageClient />)
    expect(
      screen.getByText(/search for a stock to add it to your watchlist/i)
    ).toBeInTheDocument()
  })

  it('shows .JK search results in dropdown after typing', async () => {
    setFetchHandler((url) => {
      if (url.includes('/api/stocks/search')) {
        return [
          { code: 'BBCA.JK', name: 'Bank Central Asia', sector: '', exchange: 'JKT' }
        ]
      }
      return {}
    })
    const user = userEvent.setup()
    renderWithQuery(<WatchlistPageClient />)

    await user.type(screen.getByPlaceholderText(/search/i), 'BBCA')
    await waitFor(() =>
      expect(screen.getByText('Bank Central Asia')).toBeInTheDocument()
    )
  })

  it('selecting a result adds row with name and price', async () => {
    setFetchHandler((url) => {
      if (url.includes('/api/stocks/search')) {
        return [
          { code: 'BBCA.JK', name: 'Bank Central Asia', sector: '', exchange: 'JKT' }
        ]
      }
      if (url.includes('/api/stocks/quotes')) {
        return { 'BBCA.JK': { price: 9500, changePercent: 1.23 } }
      }
      return {}
    })
    const user = userEvent.setup()
    renderWithQuery(<WatchlistPageClient />)

    await user.type(screen.getByPlaceholderText(/search/i), 'BBCA')
    await waitFor(() =>
      expect(screen.getByText('Bank Central Asia')).toBeInTheDocument()
    )
    await user.click(screen.getByText('Bank Central Asia'))

    const row = await screen.findByTestId('watchlist-row-BBCA')
    expect(row).toHaveTextContent('BBCA')
    expect(row).toHaveTextContent('Bank Central Asia')
    await waitFor(() => expect(row).toHaveTextContent('9.500'))
  })

  it('does not duplicate when same code selected twice', async () => {
    setFetchHandler((url) => {
      if (url.includes('/api/stocks/search')) {
        return [
          { code: 'BBCA.JK', name: 'Bank Central Asia', sector: '', exchange: 'JKT' }
        ]
      }
      if (url.includes('/api/stocks/quotes')) {
        return { 'BBCA.JK': { price: 9500, changePercent: 1.23 } }
      }
      return {}
    })
    const user = userEvent.setup()
    renderWithQuery(<WatchlistPageClient />)

    const input = screen.getByPlaceholderText(/search/i)
    await user.type(input, 'BBCA')
    await waitFor(() =>
      expect(screen.getByText('Bank Central Asia')).toBeInTheDocument()
    )
    await user.click(screen.getByText('Bank Central Asia'))
    await screen.findByTestId('watchlist-row-BBCA')

    await user.clear(input)
    await user.type(input, 'BBCA')
    await waitFor(() =>
      expect(screen.getByText('Bank Central Asia')).toBeInTheDocument()
    )
    await user.click(screen.getByText('Bank Central Asia'))

    expect(screen.getAllByTestId('watchlist-row-BBCA')).toHaveLength(1)
  })

  it('removes a row when remove button clicked', async () => {
    setFetchHandler((url) => {
      if (url.includes('/api/stocks/search')) {
        return [
          { code: 'BBCA.JK', name: 'Bank Central Asia', sector: '', exchange: 'JKT' }
        ]
      }
      if (url.includes('/api/stocks/quotes')) {
        return { 'BBCA.JK': { price: 9500, changePercent: 1.23 } }
      }
      return {}
    })
    const user = userEvent.setup()
    renderWithQuery(<WatchlistPageClient />)

    await user.type(screen.getByPlaceholderText(/search/i), 'BBCA')
    await waitFor(() =>
      expect(screen.getByText('Bank Central Asia')).toBeInTheDocument()
    )
    await user.click(screen.getByText('Bank Central Asia'))
    const row = await screen.findByTestId('watchlist-row-BBCA')
    await user.click(row.querySelector('[data-testid="remove-BBCA"]')!)

    await waitFor(() =>
      expect(screen.queryByTestId('watchlist-row-BBCA')).not.toBeInTheDocument()
    )
  })

  it('renders row link to /stocks/[code]', async () => {
    useWatchlist.setState({
      items: [{ code: 'BBCA', addedAt: '2026-01-01T00:00:00.000Z' }]
    })
    useStockMeta.setState({
      meta: { BBCA: { name: 'Bank Central Asia', sector: '' } }
    })
    setFetchHandler((url) => {
      if (url.includes('/api/stocks/prices')) return { 'BBCA.JK': 9500 }
      return {}
    })
    renderWithQuery(<WatchlistPageClient />)

    const row = await screen.findByTestId('watchlist-row-BBCA')
    const link = row.querySelector('a[href="/stocks/BBCA"]')
    expect(link).not.toBeNull()
  })
})
