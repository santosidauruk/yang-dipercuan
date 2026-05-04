import { describe, it, expect } from 'vitest'
import { formatDateDisplay } from './date'

describe('formatDateDisplay', () => {
  it('formats ISO YYYY-MM-DD as DD/MM/YYYY', () => {
    expect(formatDateDisplay('2026-01-15')).toBe('15/01/2026')
  })

  it('zero-pads single-digit days and months', () => {
    expect(formatDateDisplay('2026-03-04')).toBe('04/03/2026')
  })
})
