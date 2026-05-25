import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DividendsPageClient } from './DividendsPageClient'
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
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => []
  } as Response)
  vi.stubGlobal('fetch', fetchMock)
})

describe('DividendsPageClient CSV import', () => {
  it('appends valid rows', async () => {
    const user = userEvent.setup()
    renderWithQuery(<DividendsPageClient />)

    const file = new File(
      ['id,date,code,dps\nd1,2026-04-01,BBCA,50\n'],
      'dividends.csv',
      { type: 'text/csv' }
    )
    const input = screen.getByTestId('csv-import-input') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() =>
      expect(useDividends.getState().dividends).toHaveLength(1)
    )
    expect(useDividends.getState().dividends[0]).toMatchObject({
      id: 'd1',
      code: 'BBCA',
      dps: 50
    })
  })

  it('shows error dialog on invalid row', async () => {
    const user = userEvent.setup()
    renderWithQuery(<DividendsPageClient />)

    const file = new File(
      ['id,date,code,dps\nd1,2026-04-01,BBCA,0\n'],
      'dividends.csv',
      { type: 'text/csv' }
    )
    const input = screen.getByTestId('csv-import-input') as HTMLInputElement
    await user.upload(input, file)

    expect(
      await screen.findByRole('heading', { name: /import failed/i })
    ).toBeInTheDocument()
    expect(useDividends.getState().dividends).toHaveLength(0)
  })
})
