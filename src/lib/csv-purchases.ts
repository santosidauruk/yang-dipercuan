import type { Purchase } from '@/types'
import { csvSerialize, csvParse } from './csv'

const SHARES_PER_LOT = 100
const CODE_RE = /^[A-Z]{3,5}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const CANONICAL = ['id', 'date', 'code', 'price', 'lots'] as const
const EXPORT_COLUMNS = [
  ...CANONICAL,
  'lastPrice',
  'percentChange',
  'investedValue'
] as const

export class CsvImportError extends Error {
  row: number
  reason: string
  constructor(row: number, reason: string) {
    super(`row ${row}: ${reason}`)
    this.name = 'CsvImportError'
    this.row = row
    this.reason = reason
  }
}

interface SerializeExtras {
  prices?: Record<string, number>
}

export function serializePurchases(
  purchases: Purchase[],
  extras: SerializeExtras = {}
): string {
  const rows = purchases.map((p) => {
    const last = extras.prices?.[`${p.code}.JK`]
    const invested = p.price * p.lots * SHARES_PER_LOT
    const pct =
      last !== undefined && p.price > 0
        ? Number((((last - p.price) / p.price) * 100).toFixed(4))
        : ''
    return {
      id: p.id,
      date: p.date,
      code: p.code,
      price: p.price,
      lots: p.lots,
      lastPrice: last ?? '',
      percentChange: pct,
      investedValue: invested
    }
  })
  return csvSerialize(rows, EXPORT_COLUMNS as unknown as string[])
}

function parsePositiveNumber(
  value: string,
  row: number,
  field: string
): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    throw new CsvImportError(row, `${field} must be a positive number`)
  }
  return n
}

function parsePositiveInt(value: string, row: number, field: string): number {
  const n = parsePositiveNumber(value, row, field)
  if (!Number.isInteger(n)) {
    throw new CsvImportError(row, `${field} must be a whole number`)
  }
  return n
}

export function parsePurchases(text: string): Purchase[] {
  const raw = csvParse(text)
  const out: Purchase[] = []
  const seenIds = new Set<string>()

  raw.forEach((r, idx) => {
    const rowNum = idx + 2

    const date = (r.date ?? '').trim()
    if (!DATE_RE.test(date)) {
      throw new CsvImportError(rowNum, `date must be YYYY-MM-DD`)
    }

    const code = (r.code ?? '').trim().toUpperCase()
    if (!CODE_RE.test(code)) {
      throw new CsvImportError(rowNum, `code must match /^[A-Z]{3,5}$/`)
    }

    const price = parsePositiveNumber(r.price ?? '', rowNum, 'price')
    const lots = parsePositiveInt(r.lots ?? '', rowNum, 'lots')

    let id = (r.id ?? '').trim()
    if (!id || seenIds.has(id)) {
      id = crypto.randomUUID()
    }
    seenIds.add(id)

    out.push({ id, date, code, price, lots })
  })

  return out
}
