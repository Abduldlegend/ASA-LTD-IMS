import { formatDate, formatNaira, formatNairaCompact, formatQuantity } from './format'

describe('formatNaira', () => {
  it('formats amounts with the naira sign and two decimals', () => {
    expect(formatNaira(1500)).toContain('1,500.00')
    expect(formatNaira(1500)).toContain('₦')
  })
  it('accepts decimal strings from the API', () => {
    expect(formatNaira('2500.5')).toContain('2,500.50')
  })
  it('shows a dash for invalid values', () => {
    expect(formatNaira('abc')).toBe('—')
  })
})

describe('formatNairaCompact', () => {
  it('shortens large amounts', () => {
    expect(formatNairaCompact(2_500_000)).toMatch(/2\.5M/)
  })
})

describe('formatQuantity', () => {
  it('adds the unit label', () => {
    expect(formatQuantity(120, 'bags')).toBe('120 bags')
    expect(formatQuantity(12.5, 'm2')).toBe('12.5 m²')
  })
})

describe('formatDate', () => {
  it('formats ISO dates', () => {
    expect(formatDate('2026-11-20')).toBe('20 Nov 2026')
  })
  it('shows a dash for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })
})
