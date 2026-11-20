import {
  describeInterlockStock,
  hasRate,
  INTERLOCK_RATES,
  piecesToSquareMetres,
  squareMetresToPieces,
} from './interlock'

describe('interlock conversion', () => {
  it('uses 32 pieces per m² for Double T', () => {
    expect(piecesToSquareMetres(64, INTERLOCK_RATES['Double T'])).toBe(2)
    expect(squareMetresToPieces(1, INTERLOCK_RATES['Double T'])).toBe(32)
  })
  it('uses 50 pieces per m² for I-Shape', () => {
    expect(piecesToSquareMetres(100, INTERLOCK_RATES['I-Shape'])).toBe(2)
    expect(squareMetresToPieces(1, INTERLOCK_RATES['I-Shape'])).toBe(50)
  })
  it('does not round up exact conversions', () => {
    expect(squareMetresToPieces(1.25, 32)).toBe(40)
  })
  it('rounds up to whole pieces when needed', () => {
    expect(squareMetresToPieces(1.01, 32)).toBe(33)
  })
  it('refuses designs without a rate', () => {
    expect(hasRate(null)).toBe(false)
    expect(() => piecesToSquareMetres(10, null)).toThrow()
    expect(() => squareMetresToPieces(1, undefined)).toThrow()
  })
  it('describes stock in both units', () => {
    expect(describeInterlockStock(640, 32)).toBe('640 pcs ≈ 20.00 m²')
    expect(describeInterlockStock(640, null)).toBe('640 pcs')
  })
})
