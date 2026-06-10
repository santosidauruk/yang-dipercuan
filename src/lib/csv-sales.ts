import type { Sale } from '@/types'
import { csvSerialize, csvParse } from './csv'
import { CsvImportError } from './csv-purchases'

const SHARES_PER_LOT = 100
const CODE_RE = /^[A-Z]{3,5}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const EXPORT_COLUMNS = {
  id: 'ID',
  date: 'Tanggal Penjualan',
  code: 'Kode Saham',
  price: 'Harga Penjualan',
  lots: 'Jumlah Lot',
  costBasis: 'Harga Beli Rata-Rata',
  purchaseValue: 'Nilai Investasi',
  sellValue: 'Nilai Penjualan',
  capitalGain: 'Keuntungan Modal',
  percentChange: 'Kenaikan/Penurunan'
} as const

export function serializeSales(sales: Sale[]): string {
  const rows = sales.map((s) => {
    const shares = s.lots * SHARES_PER_LOT
    const purchaseValue = s.costBasis * shares
    const sellValue = s.price * shares
    const capitalGain = (s.price - s.costBasis) * shares
    const pct =
      s.costBasis > 0
        ? Number((((s.price - s.costBasis) / s.costBasis) * 100).toFixed(4))
        : ''
    return {
      id: s.id,
      date: s.date,
      code: s.code,
      price: s.price,
      lots: s.lots,
      costBasis: s.costBasis,
      purchaseValue,
      sellValue,
      capitalGain,
      percentChange: pct
    }
  })
  return csvSerialize(rows, EXPORT_COLUMNS)
}

function positive(value: string, row: number, field: string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    throw new CsvImportError(row, `${field} must be a positive number`)
  }
  return n
}

function positiveInt(value: string, row: number, field: string): number {
  const n = positive(value, row, field)
  if (!Number.isInteger(n)) {
    throw new CsvImportError(row, `${field} must be a whole number`)
  }
  return n
}

const HEADER_ALIASES: Record<string, keyof typeof EXPORT_COLUMNS> =
  Object.entries(EXPORT_COLUMNS).reduce<
    Record<string, keyof typeof EXPORT_COLUMNS>
  >((acc, [key, label]) => {
    acc[label] = key as keyof typeof EXPORT_COLUMNS
    return acc
  }, {})

function normalizeRow(r: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...r }
  for (const [label, key] of Object.entries(HEADER_ALIASES)) {
    if (out[key] === undefined && r[label] !== undefined) {
      out[key] = r[label]
    }
  }
  return out
}

export function parseSales(text: string): Sale[] {
  const raw = csvParse(text).map(normalizeRow)
  const out: Sale[] = []
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

    const price = positive(r.price ?? '', rowNum, 'price')
    const lots = positiveInt(r.lots ?? '', rowNum, 'lots')
    const costBasis = positive(r.costBasis ?? '', rowNum, 'costBasis')

    let id = (r.id ?? '').trim()
    if (!id || seen.has(id)) id = crypto.randomUUID()
    seen.add(id)

    out.push({ id, date, code, price, lots, costBasis })
  })

  return out
}
