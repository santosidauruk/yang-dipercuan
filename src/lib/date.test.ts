import { describe, it, expect } from 'vitest'
import { formatDateDisplay } from './date'

describe('formatDateDisplay', () => {
  it('formats ISO YYYY-MM-DD as "d MMMM yyyy" id-ID', () => {
    expect(formatDateDisplay('2026-01-15')).toBe('15 Januari 2026')
  })

  it('uses Indonesian month names without zero-padding the day', () => {
    expect(formatDateDisplay('2026-03-04')).toBe('4 Maret 2026')
  })
})
