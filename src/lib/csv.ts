export type CsvRow = Record<string, string | number | undefined>

function escapeField(value: string | number | undefined): string {
  const s = value === undefined || value === null ? '' : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function csvSerialize<T extends CsvRow>(
  rows: T[],
  columns: Record<keyof T, string>
): string {
  const headerKeys = Object.keys(columns) as (keyof T)[]
  const header = headerKeys.map((k) => columns[k]).join(',')
  const lines = rows.map((row) =>
    headerKeys.map((k) => escapeField(row[k])).join(',')
  )
  return [header, ...lines].join('\n') + '\n'
}

function parseLine(
  text: string,
  start: number
): { fields: string[]; next: number } {
  const fields: string[] = []
  let i = start
  let field = ''
  let inQuotes = false

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }
    if (ch === ',') {
      fields.push(field)
      field = ''
      i++
      continue
    }
    if (ch === '\n') {
      fields.push(field)
      return { fields, next: i + 1 }
    }
    if (ch === '\r') {
      if (text[i + 1] === '\n') {
        fields.push(field)
        return { fields, next: i + 2 }
      }
      fields.push(field)
      return { fields, next: i + 1 }
    }
    field += ch
    i++
  }

  fields.push(field)
  return { fields, next: i }
}

export function csvParse(text: string): Record<string, string>[] {
  if (text.length === 0) return []

  const headerRes = parseLine(text, 0)
  const headers = headerRes.fields
  const rows: Record<string, string>[] = []
  let i = headerRes.next

  while (i < text.length) {
    const { fields, next } = parseLine(text, i)
    i = next
    // skip a completely empty trailing line
    if (fields.length === 1 && fields[0] === '') continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = fields[idx] ?? ''
    })
    rows.push(row)
  }

  return rows
}
