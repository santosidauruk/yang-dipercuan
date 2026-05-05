import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useDividends } from './useDividends'

describe('useDividends', () => {
  beforeEach(() => {
    localStorage.clear()
    useDividends.setState({ dividends: [] })
  })

  it('starts with no dividends', () => {
    expect(useDividends.getState().dividends).toEqual([])
  })

  it('addDividend appends a new record with a generated UUID', () => {
    const created = useDividends.getState().addDividend({
      date: '2026-03-01',
      code: 'BBCA',
      dps: 50
    })

    expect(created.id).toMatch(/[0-9a-f-]{8,}/i)
    expect(useDividends.getState().dividends).toHaveLength(1)
    expect(useDividends.getState().dividends[0]).toEqual(created)
  })

  it('addDividend generates unique ids for separate calls', () => {
    const a = useDividends
      .getState()
      .addDividend({ date: '2026-03-01', code: 'BBCA', dps: 50 })
    const b = useDividends
      .getState()
      .addDividend({ date: '2026-06-01', code: 'PGAS', dps: 20 })
    expect(a.id).not.toEqual(b.id)
  })

  it('removeDividend deletes the record by id', () => {
    const created = useDividends.getState().addDividend({
      date: '2026-03-01',
      code: 'BBCA',
      dps: 50
    })
    useDividends.getState().removeDividend(created.id)
    expect(useDividends.getState().dividends).toEqual([])
  })

  it('removeDividend ignores unknown ids', () => {
    useDividends
      .getState()
      .addDividend({ date: '2026-03-01', code: 'BBCA', dps: 50 })
    useDividends.getState().removeDividend('does-not-exist')
    expect(useDividends.getState().dividends).toHaveLength(1)
  })

  it('removeDividendsByCode deletes all dividends for a code', () => {
    useDividends
      .getState()
      .addDividend({ date: '2026-03-01', code: 'BBCA', dps: 50 })
    useDividends
      .getState()
      .addDividend({ date: '2026-06-01', code: 'BBCA', dps: 75 })
    useDividends
      .getState()
      .addDividend({ date: '2026-03-01', code: 'PGAS', dps: 20 })

    useDividends.getState().removeDividendsByCode('BBCA')

    const remaining = useDividends.getState().dividends
    expect(remaining).toHaveLength(1)
    expect(remaining[0].code).toBe('PGAS')
  })

  it('persists dividends under yangdipercuan:dividends', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    useDividends
      .getState()
      .addDividend({ date: '2026-03-01', code: 'BBCA', dps: 50 })

    const calls = setItem.mock.calls.filter(
      ([key]) => key === 'yangdipercuan:dividends'
    )
    expect(calls.length).toBeGreaterThan(0)
    setItem.mockRestore()
  })
})
