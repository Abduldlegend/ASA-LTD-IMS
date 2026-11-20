/**
 * Interlocks are produced and stocked in pieces but sold in square metres.
 * Each interlock product carries its own pieces-per-square-metre rate
 * (Double T = 32, I-Shape = 50). Other designs have no rate yet and cannot
 * be sold in m² until one is set.
 */
export const INTERLOCK_RATES = {
  'Double T': 32,
  'I-Shape': 50,
} as const

function assertRate(piecesPerSquareMetre: number | null | undefined): asserts piecesPerSquareMetre is number {
  if (!piecesPerSquareMetre || piecesPerSquareMetre <= 0) {
    throw new Error('This interlock design has no pieces-per-m² rate yet')
  }
}

export function hasRate(piecesPerSquareMetre: number | null | undefined): boolean {
  return typeof piecesPerSquareMetre === 'number' && piecesPerSquareMetre > 0
}

export function piecesToSquareMetres(pieces: number, piecesPerSquareMetre: number | null | undefined): number {
  assertRate(piecesPerSquareMetre)
  return pieces / piecesPerSquareMetre
}

/** Whole pieces needed to cover an area; always rounds up so the customer is never short. */
export function squareMetresToPieces(squareMetres: number, piecesPerSquareMetre: number | null | undefined): number {
  assertRate(piecesPerSquareMetre)
  // The small epsilon avoids 1.25 * 32 = 40.00000000000001 rounding up to 41.
  return Math.ceil(squareMetres * piecesPerSquareMetre - 1e-9)
}

/** "640 pcs ≈ 20.00 m²" */
export function describeInterlockStock(pieces: number, piecesPerSquareMetre: number | null | undefined): string {
  if (!hasRate(piecesPerSquareMetre)) return `${pieces.toLocaleString('en-NG')} pcs`
  const m2 = piecesToSquareMetres(pieces, piecesPerSquareMetre)
  return `${pieces.toLocaleString('en-NG')} pcs ≈ ${m2.toFixed(2)} m²`
}
