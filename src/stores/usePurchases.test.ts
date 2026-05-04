import { beforeEach, describe, it, expect, vi } from 'vitest'
import { usePurchases } from './usePurchases'

describe('usePurchases', () => {
  beforeEach(() => {
    localStorage.clear()
    usePurchases.setState({ purchases: [] })
  })

  it('starts with no purchases', () => {
    expect(usePurchases.getState().purchases).toEqual([])
  })

  it('addPurchase appends a new record with a generated UUID', () => {
    const created = usePurchases.getState().addPurchase({
      date: '2026-01-15',
      code: 'BBCA',
      price: 9500,
      lots: 5
    })

    expect(created.id).toMatch(/[0-9a-f-]{8,}/i)
    expect(usePurchases.getState().purchases).toHaveLength(1)
    expect(usePurchases.getState().purchases[0]).toEqual(created)
  })

  it('addPurchase generates unique ids for separate calls', () => {
    const a = usePurchases
      .getState()
      .addPurchase({ date: '2026-01-15', code: 'BBCA', price: 9500, lots: 5 })
    const b = usePurchases
      .getState()
      .addPurchase({ date: '2026-01-16', code: 'PGAS', price: 1500, lots: 10 })
    expect(a.id).not.toEqual(b.id)
  })

  it('updatePurchase patches the record by id', () => {
    const created = usePurchases.getState().addPurchase({
      date: '2026-01-15',
      code: 'BBCA',
      price: 9500,
      lots: 5
    })

    usePurchases.getState().updatePurchase(created.id, { lots: 8, price: 9600 })

    const after = usePurchases.getState().purchases[0]
    expect(after.id).toBe(created.id)
    expect(after.lots).toBe(8)
    expect(after.price).toBe(9600)
    expect(after.code).toBe('BBCA')
  })

  it('updatePurchase ignores unknown ids', () => {
    usePurchases
      .getState()
      .addPurchase({ date: '2026-01-15', code: 'BBCA', price: 9500, lots: 5 })
    usePurchases.getState().updatePurchase('does-not-exist', { lots: 99 })
    expect(usePurchases.getState().purchases[0].lots).toBe(5)
  })

  it('removePurchase deletes the record by id', () => {
    const created = usePurchases.getState().addPurchase({
      date: '2026-01-15',
      code: 'BBCA',
      price: 9500,
      lots: 5
    })
    usePurchases.getState().removePurchase(created.id)
    expect(usePurchases.getState().purchases).toEqual([])
  })

  it('persists purchases under yangdipercuan:purchases', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    usePurchases
      .getState()
      .addPurchase({ date: '2026-01-15', code: 'BBCA', price: 9500, lots: 5 })

    const calls = setItem.mock.calls.filter(
      ([key]) => key === 'yangdipercuan:purchases'
    )
    expect(calls.length).toBeGreaterThan(0)
    setItem.mockRestore()
  })
})
