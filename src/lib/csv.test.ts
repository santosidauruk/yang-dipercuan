import { describe, it, expect } from 'vitest'
import { csvSerialize, csvParse } from './csv'

describe('csvSerialize', () => {
  it('writes header row from columns map in given order', () => {
    const out = csvSerialize([{ a: 1, b: 'x' }], { a: 'a', b: 'b' })
    expect(out.split('\n')[0]).toBe('a,b')
  })

  it('serializes rows in given column order', () => {
    const out = csvSerialize(
      [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' }
      ],
      { a: 'a', b: 'b' }
    )
    expect(out.trim().split('\n')).toEqual(['a,b', '1,x', '2,y'])
  })

  it('quotes fields containing comma', () => {
    const out = csvSerialize([{ a: 'one, two', b: 1 }], { a: 'a', b: 'b' })
    expect(out.trim().split('\n')[1]).toBe('"one, two",1')
  })

  it('quotes fields containing double-quote and escapes by doubling', () => {
    const out = csvSerialize([{ a: 'he said "hi"' }], { a: 'a' })
    expect(out.trim().split('\n')[1]).toBe('"he said ""hi"""')
  })

  it('quotes fields containing newline', () => {
    const out = csvSerialize([{ a: 'line1\nline2' }], { a: 'a' })
    expect(out.trim().split('\n').length).toBeGreaterThan(2)
    expect(out).toContain('"line1\nline2"')
  })

  it('renders missing keys as empty', () => {
    const out = csvSerialize([{ a: 1 } as { a: number; b?: string }], {
      a: 'a',
      b: 'b'
    })
    expect(out.trim().split('\n')[1]).toBe('1,')
  })
})

describe('csvParse', () => {
  it('parses simple rows using header as keys', () => {
    const rows = csvParse('a,b\n1,x\n2,y\n')
    expect(rows).toEqual([
      { a: '1', b: 'x' },
      { a: '2', b: 'y' }
    ])
  })

  it('tolerates trailing newline and CRLF', () => {
    const rows = csvParse('a,b\r\n1,x\r\n')
    expect(rows).toEqual([{ a: '1', b: 'x' }])
  })

  it('parses quoted fields with comma', () => {
    const rows = csvParse('a,b\n"one, two",1\n')
    expect(rows).toEqual([{ a: 'one, two', b: '1' }])
  })

  it('parses quoted fields with escaped quote', () => {
    const rows = csvParse('a\n"he said ""hi"""\n')
    expect(rows).toEqual([{ a: 'he said "hi"' }])
  })

  it('parses quoted multiline field', () => {
    const rows = csvParse('a,b\n"l1\nl2",x\n')
    expect(rows).toEqual([{ a: 'l1\nl2', b: 'x' }])
  })

  it('round-trips with csvSerialize', () => {
    const input = [
      { id: 'p1', code: 'BBCA', note: 'normal' },
      { id: 'p2', code: 'PGAS', note: 'has, comma "and" quote' }
    ]
    const text = csvSerialize(input, {
      id: 'id',
      code: 'code',
      note: 'note'
    })
    expect(csvParse(text)).toEqual(
      input.map((r) => ({ id: r.id, code: r.code, note: r.note }))
    )
  })

  it('returns [] for empty input', () => {
    expect(csvParse('')).toEqual([])
  })

  it('returns [] for header-only input', () => {
    expect(csvParse('a,b\n')).toEqual([])
  })
})
