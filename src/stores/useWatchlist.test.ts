import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useWatchlist } from './useWatchlist'

describe('useWatchlist', () => {
  beforeEach(() => {
    localStorage.clear()
    useWatchlist.setState({ items: [] })
  })

  it('starts with no items', () => {
    expect(useWatchlist.getState().items).toEqual([])
  })

  it('addItem appends a WatchlistItem with code and addedAt timestamp', () => {
    const before = Date.now()
    useWatchlist.getState().addItem('BBCA')
    const after = Date.now()

    const items = useWatchlist.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].code).toBe('BBCA')
    const ts = Date.parse(items[0].addedAt)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('addItem ignores duplicate codes', () => {
    useWatchlist.getState().addItem('BBCA')
    useWatchlist.getState().addItem('BBCA')
    expect(useWatchlist.getState().items).toHaveLength(1)
  })

  it('removeItem deletes by code', () => {
    useWatchlist.getState().addItem('BBCA')
    useWatchlist.getState().addItem('PGAS')
    useWatchlist.getState().removeItem('BBCA')
    expect(useWatchlist.getState().items.map((i) => i.code)).toEqual(['PGAS'])
  })

  it('has tells whether code is present', () => {
    useWatchlist.getState().addItem('BBCA')
    expect(useWatchlist.getState().has('BBCA')).toBe(true)
    expect(useWatchlist.getState().has('PGAS')).toBe(false)
  })

  it('persists items under granary:watchlist', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    useWatchlist.getState().addItem('BBCA')

    const calls = setItem.mock.calls.filter(
      ([key]) => key === 'granary:watchlist'
    )
    expect(calls.length).toBeGreaterThan(0)
    setItem.mockRestore()
  })
})
