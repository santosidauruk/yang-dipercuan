import { describe, it, expect } from 'vitest'
import {
  serializePurchases,
  parsePurchases,
  CsvImportError
} from './csv-purchases'
import type { Purchase } from '@/types'

const buy = (
  code: string,
  date: string,
  lots: number,
  price: number,
  id = `${code}-${date}`
): Purchase => ({ id, code, date, lots, price })

describe('serializePurchases', () => {
  it('writes canonical header + rows', () => {
    const text = serializePurchases([buy('BBCA', '2026-01-01', 5, 9000)])
    const lines = text.trim().split('\n')
    expect(lines[0]).toBe(
      'ID,Tanggal Pembelian,Kode Saham,Harga Beli,Jumlah Lot,Harga Terakhir,Kenaikan/Penurunan,Nilai Investasi'
    )
    expect(lines[1]).toBe('BBCA-2026-01-01,2026-01-01,BBCA,9000,5,,,4500000')
  })

  it('includes computed lastPrice + percentChange when provided', () => {
    const text = serializePurchases([buy('BBCA', '2026-01-01', 5, 9000)], {
      prices: { 'BBCA.JK': 9450 }
    })
    expect(text.trim().split('\n')[1]).toBe(
      'BBCA-2026-01-01,2026-01-01,BBCA,9000,5,9450,5,4500000'
    )
  })
})

describe('parsePurchases', () => {
  it('parses canonical-only header', () => {
    const text =
      'id,date,code,price,lots\n' +
      'p1,2026-01-01,BBCA,9000,5\n' +
      'p2,2026-01-02,PGAS,1500,3\n'
    const out = parsePurchases(text)
    expect(out).toEqual([
      { id: 'p1', date: '2026-01-01', code: 'BBCA', price: 9000, lots: 5 },
      { id: 'p2', date: '2026-01-02', code: 'PGAS', price: 1500, lots: 3 }
    ])
  })

  it('ignores computed/extra columns from a re-imported export', () => {
    const text =
      'id,date,code,price,lots,lastPrice,percentChange,investedValue\n' +
      'p1,2026-01-01,BBCA,9000,5,9450,5,4500000\n'
    const out = parsePurchases(text)
    expect(out).toEqual([
      { id: 'p1', date: '2026-01-01', code: 'BBCA', price: 9000, lots: 5 }
    ])
  })

  it('regenerates id when missing', () => {
    const text = 'id,date,code,price,lots\n,2026-01-01,BBCA,9000,5\n'
    const [row] = parsePurchases(text)
    expect(row.id).toBeTruthy()
    expect(row.id.length).toBeGreaterThan(8)
  })

  it('regenerates id on duplicate within file', () => {
    const text =
      'id,date,code,price,lots\n' +
      'dup,2026-01-01,BBCA,9000,5\n' +
      'dup,2026-01-02,PGAS,1500,3\n'
    const [a, b] = parsePurchases(text)
    expect(a.id).toBe('dup')
    expect(b.id).not.toBe('dup')
  })

  it('round-trips with serializePurchases (canonical only)', () => {
    const input = [buy('BBCA', '2026-01-01', 5, 9000, 'p1')]
    const text = serializePurchases(input)
    expect(parsePurchases(text)).toEqual(input)
  })

  it('throws CsvImportError on invalid code', () => {
    const text = 'id,date,code,price,lots\np1,2026-01-01,bb,9000,5\n'
    expect(() => parsePurchases(text)).toThrowError(CsvImportError)
  })

  it('throws on bad date', () => {
    const text = 'id,date,code,price,lots\np1,01/01/2026,BBCA,9000,5\n'
    expect(() => parsePurchases(text)).toThrow(/row 2/)
  })

  it('throws on non-positive price', () => {
    const text = 'id,date,code,price,lots\np1,2026-01-01,BBCA,0,5\n'
    expect(() => parsePurchases(text)).toThrow(/price/i)
  })

  it('throws on non-positive lots', () => {
    const text = 'id,date,code,price,lots\np1,2026-01-01,BBCA,9000,0\n'
    expect(() => parsePurchases(text)).toThrow(/lots/i)
  })

  it('throws on non-integer lots', () => {
    const text = 'id,date,code,price,lots\np1,2026-01-01,BBCA,9000,1.5\n'
    expect(() => parsePurchases(text)).toThrow(/lots/i)
  })

  it('first invalid row aborts (no partial results visible to caller)', () => {
    const text =
      'id,date,code,price,lots\n' +
      'p1,2026-01-01,BBCA,9000,5\n' +
      'p2,2026-01-02,BAD!,9000,5\n' +
      'p3,2026-01-03,BBCA,9000,5\n'
    try {
      parsePurchases(text)
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(CsvImportError)
      expect((e as CsvImportError).row).toBe(3)
    }
  })
})
