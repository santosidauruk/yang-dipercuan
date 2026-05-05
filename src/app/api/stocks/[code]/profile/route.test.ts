import { beforeEach, describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/yahoo-finance', () => ({
  getProfile: vi.fn()
}))

import { GET } from './route'
import { getProfile } from '@/lib/yahoo-finance'

const mockGetProfile = vi.mocked(getProfile)

const callRoute = (code: string) =>
  GET(new Request(`http://localhost/api/stocks/${code}/profile`), {
    params: Promise.resolve({ code })
  })

describe('GET /api/stocks/[code]/profile', () => {
  beforeEach(() => {
    mockGetProfile.mockReset()
  })

  it('returns {name, sector} for a valid symbol', async () => {
    mockGetProfile.mockResolvedValue({
      price: { longName: 'Bank Central Asia Tbk' },
      assetProfile: { sector: 'Financial Services' }
    })
    const res = await callRoute('BBCA')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      code: 'BBCA',
      name: 'Bank Central Asia Tbk',
      sector: 'Financial Services'
    })
  })

  it('falls back to "Unknown" when assetProfile has no sector', async () => {
    mockGetProfile.mockResolvedValue({
      price: { longName: 'Some Co' },
      assetProfile: {}
    })
    const res = await callRoute('XYZA')
    expect(await res.json()).toMatchObject({ sector: 'Unknown' })
  })

  it('appends .JK when caller passes bare code', async () => {
    mockGetProfile.mockResolvedValue({
      price: { longName: 'X' },
      assetProfile: { sector: 'Energy' }
    })
    await callRoute('PGAS')
    expect(mockGetProfile).toHaveBeenCalledWith('PGAS.JK')
  })

  it('does not double-append .JK when already present', async () => {
    mockGetProfile.mockResolvedValue({
      price: { longName: 'X' },
      assetProfile: { sector: 'Energy' }
    })
    await callRoute('PGAS.JK')
    expect(mockGetProfile).toHaveBeenCalledWith('PGAS.JK')
  })

  it('returns 500 on Yahoo failure', async () => {
    mockGetProfile.mockRejectedValue(new Error('boom'))
    const res = await callRoute('BBCA')
    expect(res.status).toBe(500)
  })
})
