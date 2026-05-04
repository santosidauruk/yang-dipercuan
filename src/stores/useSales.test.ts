import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useSales } from './useSales'

describe('useSales', () => {
  beforeEach(() => {
    localStorage.clear()
    useSales.setState({ sales: [] })
  })

  it('starts with no sales', () => {
    expect(useSales.getState().sales).toEqual([])
  })

  it('addSale appends a new record with a generated UUID', () => {
    const created = useSales.getState().addSale({
      date: '2026-02-01',
      code: 'BBCA',
      price: 10000,
      lots: 3,
      costBasis: 9500
    })

    expect(created.id).toMatch(/[0-9a-f-]{8,}/i)
    expect(useSales.getState().sales).toHaveLength(1)
    expect(useSales.getState().sales[0]).toEqual(created)
  })

  it('addSale generates unique ids for separate calls', () => {
    const a = useSales
      .getState()
      .addSale({ date: '2026-02-01', code: 'BBCA', price: 10000, lots: 3, costBasis: 9500 })
    const b = useSales
      .getState()
      .addSale({ date: '2026-02-15', code: 'PGAS', price: 1600, lots: 5, costBasis: 1500 })
    expect(a.id).not.toEqual(b.id)
  })

  it('updateSale patches the record by id', () => {
    const created = useSales.getState().addSale({
      date: '2026-02-01',
      code: 'BBCA',
      price: 10000,
      lots: 3,
      costBasis: 9500
    })

    useSales.getState().updateSale(created.id, { lots: 5, price: 10200 })

    const after = useSales.getState().sales[0]
    expect(after.id).toBe(created.id)
    expect(after.lots).toBe(5)
    expect(after.price).toBe(10200)
    expect(after.code).toBe('BBCA')
  })

  it('updateSale ignores unknown ids', () => {
    useSales
      .getState()
      .addSale({ date: '2026-02-01', code: 'BBCA', price: 10000, lots: 3, costBasis: 9500 })
    useSales.getState().updateSale('does-not-exist', { lots: 99 })
    expect(useSales.getState().sales[0].lots).toBe(3)
  })

  it('removeSale deletes the record by id', () => {
    const created = useSales.getState().addSale({
      date: '2026-02-01',
      code: 'BBCA',
      price: 10000,
      lots: 3,
      costBasis: 9500
    })
    useSales.getState().removeSale(created.id)
    expect(useSales.getState().sales).toEqual([])
  })

  it('removeSalesByCode deletes all sales for a code', () => {
    useSales
      .getState()
      .addSale({ date: '2026-02-01', code: 'BBCA', price: 10000, lots: 3, costBasis: 9500 })
    useSales
      .getState()
      .addSale({ date: '2026-02-10', code: 'BBCA', price: 10200, lots: 2, costBasis: 9500 })
    useSales
      .getState()
      .addSale({ date: '2026-02-05', code: 'PGAS', price: 1600, lots: 5, costBasis: 1500 })

    useSales.getState().removeSalesByCode('BBCA')

    const remaining = useSales.getState().sales
    expect(remaining).toHaveLength(1)
    expect(remaining[0].code).toBe('PGAS')
  })

  it('persists sales under yangdipercuan:sales', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    useSales
      .getState()
      .addSale({ date: '2026-02-01', code: 'BBCA', price: 10000, lots: 3, costBasis: 9500 })

    const calls = setItem.mock.calls.filter(
      ([key]) => key === 'yangdipercuan:sales'
    )
    expect(calls.length).toBeGreaterThan(0)
    setItem.mockRestore()
  })
})
