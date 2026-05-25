import { describe, it, expect } from 'vitest'
import { serializeDividends, parseDividends } from './csv-dividends'
import { CsvImportError } from './csv-purchases'
import type { Dividend, Purchase, Sale } from '@/types'

const div = (
  code: string,
  date: string,
  dps: number,
  id = `d-${code}-${date}`
): Dividend => ({ id, code, date, dps })

const buy = (code: string, date: string, lots: number, price: number): Purchase => ({
  id: `${code}-${date}`,
  code,
  date,
  lots,
  price
})

describe('serializeDividends', () => {
  it('writes canonical-only header when no portfolio context', () => {
    const text = serializeDividends([div('BBCA', '2026-04-01', 50)])
    const lines = text.trim().split('\n')
    expect(lines[0]).toBe(
      'id,date,code,dps,qtyHeld,totalDividend,yieldPct,purchaseValue'
    )
    expect(lines[1]).toBe('d-BBCA-2026-04-01,2026-04-01,BBCA,50,,,,')
  })

  it('writes computed fields when purchases provided', () => {
    const purchases: Purchase[] = [buy('BBCA', '2026-01-01', 10, 9000)]
    const sales: Sale[] = []
    const text = serializeDividends([div('BBCA', '2026-04-01', 50)], {
      purchases,
      sales
    })
    // qtyHeld = 10 lots (1000 shares), totalDividend = 50*1000 = 50000
    // yieldPct = (50/9000)*100 ≈ 0.5556, purchaseValue = 9000*1000 = 9_000_000
    expect(text.trim().split('\n')[1]).toBe(
      'd-BBCA-2026-04-01,2026-04-01,BBCA,50,10,50000,0.5556,9000000'
    )
  })
})

describe('parseDividends', () => {
  it('parses canonical header', () => {
    const text = 'id,date,code,dps\nd1,2026-04-01,BBCA,50\n'
    expect(parseDividends(text)).toEqual([
      { id: 'd1', date: '2026-04-01', code: 'BBCA', dps: 50 }
    ])
  })

  it('round-trips with serializeDividends (canonical only)', () => {
    const input = [div('BBCA', '2026-04-01', 50, 'd1')]
    expect(parseDividends(serializeDividends(input))).toEqual(input)
  })

  it('throws on non-positive dps', () => {
    const text = 'id,date,code,dps\nd1,2026-04-01,BBCA,0\n'
    expect(() => parseDividends(text)).toThrow(/dps/)
  })

  it('aborts on first invalid row with CsvImportError row number', () => {
    const text =
      'id,date,code,dps\n' +
      'd1,2026-04-01,BBCA,50\n' +
      'd2,bad,BBCA,50\n'
    try {
      parseDividends(text)
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(CsvImportError)
      expect((e as CsvImportError).row).toBe(3)
    }
  })

  it('regenerates id when missing', () => {
    const text = 'id,date,code,dps\n,2026-04-01,BBCA,50\n'
    const [row] = parseDividends(text)
    expect(row.id).toBeTruthy()
  })
})
