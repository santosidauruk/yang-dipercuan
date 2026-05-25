import { describe, it, expect } from 'vitest'
import { serializeSales, parseSales } from './csv-sales'
import { CsvImportError } from './csv-purchases'
import type { Sale } from '@/types'

const sell = (
  code: string,
  date: string,
  lots: number,
  price: number,
  costBasis: number,
  id = `s-${code}-${date}`
): Sale => ({ id, code, date, lots, price, costBasis })

describe('serializeSales', () => {
  it('writes canonical + computed header and row', () => {
    const text = serializeSales([sell('BBCA', '2026-02-01', 3, 10000, 9000)])
    const lines = text.trim().split('\n')
    expect(lines[0]).toBe(
      'id,date,code,price,lots,costBasis,purchaseValue,sellValue,capitalGain,percentChange'
    )
    // shares = 300; purchaseValue=2_700_000; sellValue=3_000_000; gain=300_000; pct≈11.1111
    expect(lines[1]).toBe(
      's-BBCA-2026-02-01,2026-02-01,BBCA,10000,3,9000,2700000,3000000,300000,11.1111'
    )
  })
})

describe('parseSales', () => {
  it('parses canonical-only header', () => {
    const text =
      'id,date,code,price,lots,costBasis\n' +
      's1,2026-02-01,BBCA,10000,3,9000\n'
    expect(parseSales(text)).toEqual([
      {
        id: 's1',
        date: '2026-02-01',
        code: 'BBCA',
        price: 10000,
        lots: 3,
        costBasis: 9000
      }
    ])
  })

  it('round-trips with serializeSales (canonical only)', () => {
    const input = [sell('BBCA', '2026-02-01', 3, 10000, 9000, 's1')]
    expect(parseSales(serializeSales(input))).toEqual(input)
  })

  it('throws on non-positive costBasis', () => {
    const text =
      'id,date,code,price,lots,costBasis\ns1,2026-02-01,BBCA,10000,3,0\n'
    expect(() => parseSales(text)).toThrow(/costBasis/)
  })

  it('regenerates id when missing', () => {
    const text = 'id,date,code,price,lots,costBasis\n,2026-02-01,BBCA,10000,3,9000\n'
    const [row] = parseSales(text)
    expect(row.id).toBeTruthy()
  })

  it('aborts on first invalid row with CsvImportError row number', () => {
    const text =
      'id,date,code,price,lots,costBasis\n' +
      's1,2026-02-01,BBCA,10000,3,9000\n' +
      's2,bad-date,BBCA,10000,3,9000\n'
    try {
      parseSales(text)
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(CsvImportError)
      expect((e as CsvImportError).row).toBe(3)
    }
  })
})
