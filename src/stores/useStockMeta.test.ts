import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useStockMeta } from './useStockMeta'

describe('useStockMeta', () => {
  beforeEach(() => {
    localStorage.clear()
    useStockMeta.setState({ meta: {} })
  })

  it('starts empty', () => {
    expect(useStockMeta.getState().meta).toEqual({})
  })

  it('setMeta upserts entries by code', () => {
    useStockMeta.getState().setMeta('BBCA', {
      name: 'Bank Central Asia Tbk',
      sector: 'Financial Services'
    })
    expect(useStockMeta.getState().meta.BBCA).toEqual({
      name: 'Bank Central Asia Tbk',
      sector: 'Financial Services'
    })
  })

  it('setMeta overwrites existing entry', () => {
    useStockMeta.getState().setMeta('BBCA', { name: 'old', sector: 'Unknown' })
    useStockMeta
      .getState()
      .setMeta('BBCA', { name: 'new', sector: 'Financial Services' })
    expect(useStockMeta.getState().meta.BBCA.name).toBe('new')
  })

  it('persists under yangdipercuan:stockMeta', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    useStockMeta
      .getState()
      .setMeta('BBCA', { name: 'X', sector: 'Financial Services' })
    const calls = setItem.mock.calls.filter(
      ([key]) => key === 'yangdipercuan:stockMeta'
    )
    expect(calls.length).toBeGreaterThan(0)
    setItem.mockRestore()
  })
})
