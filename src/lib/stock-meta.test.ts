import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fetchStockProfile } from './stock-meta'

describe('fetchStockProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('GETs /api/stocks/[code]/profile and returns {name, sector}', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'BBCA',
          name: 'Bank Central Asia Tbk',
          sector: 'Financial Services'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const meta = await fetchStockProfile('BBCA')
    expect(fetchSpy).toHaveBeenCalledWith('/api/stocks/BBCA/profile')
    expect(meta).toEqual({
      name: 'Bank Central Asia Tbk',
      sector: 'Financial Services'
    })
  })

  it('throws on non-200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('boom', { status: 500 })
    )
    await expect(fetchStockProfile('BBCA')).rejects.toThrow()
  })
})
