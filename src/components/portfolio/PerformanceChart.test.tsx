import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PerformanceChart } from './PerformanceChart'
import type { Purchase, Sale } from '@/types'

function renderChart(props: {
  purchases: Purchase[]
  sales: Sale[]
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  })
  return render(
    <QueryClientProvider client={client}>
      <PerformanceChart purchases={props.purchases} sales={props.sales} />
    </QueryClientProvider>
  )
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const ohlcv = (date: string, close: number) => ({
  time: Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000),
  open: close,
  high: close,
  low: close,
  close,
  volume: 0
})

describe('PerformanceChart', () => {
  it('shows empty state when no purchases', () => {
    renderChart({ purchases: [], sales: [] })
    expect(
      screen.getByText(/add a purchase to see performance/i)
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders window selector buttons when purchases exist', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    )
    renderChart({
      purchases: [
        { id: 'p1', code: 'BBCA', date: '2025-12-01', lots: 1, price: 1000 }
      ],
      sales: []
    })
    expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '6M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument()
  })

  it('default window is 1Y (aria-pressed)', () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    )
    renderChart({
      purchases: [
        { id: 'p1', code: 'BBCA', date: '2025-12-01', lots: 1, price: 1000 }
      ],
      sales: []
    })
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('clicking window button toggles aria-pressed', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    )
    renderChart({
      purchases: [
        { id: 'p1', code: 'BBCA', date: '2025-12-01', lots: 1, price: 1000 }
      ],
      sales: []
    })
    await userEvent.click(screen.getByRole('button', { name: '3M' }))
    expect(screen.getByRole('button', { name: '3M' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('fetches IHSG and held-code history once purchases exist', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('%5EJKSE') || url.includes('^JKSE')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([ohlcv('2025-12-01', 7000), ohlcv('2026-01-01', 7700)]),
            { status: 200 }
          )
        )
      }
      if (url.includes('/api/stocks/BBCA/history')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([ohlcv('2025-12-01', 1000), ohlcv('2026-01-01', 1100)]),
            { status: 200 }
          )
        )
      }
      return Promise.resolve(new Response('[]', { status: 200 }))
    })

    renderChart({
      purchases: [
        { id: 'p1', code: 'BBCA', date: '2025-12-01', lots: 1, price: 1000 }
      ],
      sales: []
    })

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c) => c[0] as string)
      expect(calls.some((u) => u.includes('/history'))).toBe(true)
      expect(
        calls.some((u) => u.includes('%5EJKSE') || u.includes('^JKSE'))
      ).toBe(true)
      expect(calls.some((u) => u.includes('/api/stocks/BBCA/history'))).toBe(
        true
      )
    })
  })
})
