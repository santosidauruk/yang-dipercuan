import type { Dividend, Purchase, Sale } from '@/types'
import { csvSerialize, csvParse } from './csv'
import { CsvImportError } from './csv-purchases'
import { dividendRow } from './portfolio'

const CODE_RE = /^[A-Z]{3,5}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const EXPORT_COLUMNS = [
  'id',
  'date',
  'code',
  'dps',
  'qtyHeld',
  'totalDividend',
  'yieldPct',
  'purchaseValue'
] as const

interface SerializeExtras {
  purchases?: Purchase[]
  sales?: Sale[]
}

export function serializeDividends(
  dividends: Dividend[],
  extras: SerializeExtras = {}
): string {
  const { purchases, sales } = extras
  const rows = dividends.map((d) => {
    if (!purchases) {
      return {
        id: d.id,
        date: d.date,
        code: d.code,
        dps: d.dps,
        qtyHeld: '',
        totalDividend: '',
        yieldPct: '',
        purchaseValue: ''
      }
    }
    const row = dividendRow(purchases, sales ?? [], d)
    return {
      id: d.id,
      date: d.date,
      code: d.code,
      dps: d.dps,
      qtyHeld: row.qtyHeld,
      totalDividend: row.totalDividend,
      yieldPct: Number(row.yieldPct.toFixed(4)),
      purchaseValue: row.purchaseValue
    }
  })
  return csvSerialize(rows, EXPORT_COLUMNS as unknown as string[])
}

function positive(value: string, row: number, field: string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    throw new CsvImportError(row, `${field} must be a positive number`)
  }
  return n
}

export function parseDividends(text: string): Dividend[] {
  const raw = csvParse(text)
  const out: Dividend[] = []
  const seen = new Set<string>()

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
    const dps = positive(r.dps ?? '', rowNum, 'dps')

    let id = (r.id ?? '').trim()
    if (!id || seen.has(id)) id = crypto.randomUUID()
    seen.add(id)

    out.push({ id, date, code, dps })
  })

  return out
}
