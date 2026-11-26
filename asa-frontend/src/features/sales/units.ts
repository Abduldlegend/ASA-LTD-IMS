import type { Product, ProductKind } from '@/features/products/types'
import { describeQuantity } from '@/features/inventory/units'
import { hasRate, squareMetresToPieces } from '@/lib/interlock'
import { parseDecimal } from '@/lib/parseNumber'
import type { PaymentMethod, PaymentStatus, SaleLine, SaleUnit } from './types'

export const UNIT_BY_KIND: Record<ProductKind, SaleUnit> = { block: 'pcs', interlock: 'm2', cement: 'bags' }

export const METHOD_LABELS: Record<PaymentMethod, string> = { cash: 'Cash', transfer: 'Bank transfer', pos: 'POS' }
export const METHODS: PaymentMethod[] = ['cash', 'transfer', 'pos']

export const round2 = (n: number) => Math.round(n * 100) / 100

/** What the form needs to know about each product it can sell. */
export type SaleProduct = Pick<Product, 'name' | 'kind' | 'price' | 'stock' | 'piecesPerSquareMetre'>
export type SaleCatalog = Record<string, SaleProduct>

export const toCatalog = (products: Product[]): SaleCatalog =>
    Object.fromEntries(products.map((p) => [p.id, { name: p.name, kind: p.kind, price: p.price, stock: p.stock, piecesPerSquareMetre: p.piecesPerSquareMetre }]))

/** Whole pieces that leave stock for this quantity. Null when it cannot be worked out (an interlock with no rate). */
export function piecesFor(product: Pick<SaleProduct, 'kind' | 'piecesPerSquareMetre'>, quantity: number): number | null {
    if (product.kind !== 'interlock') return quantity
    return hasRate(product.piecesPerSquareMetre) ? squareMetresToPieces(quantity, product.piecesPerSquareMetre) : null
}

export const lineAmount = (price: number, quantity: number) => round2(price * quantity)

/** Stock of a product written the way it is sold: "6,400 pcs ≈ 200.00 m²" or "340 bags". */
export const describeStock = (product: Pick<SaleProduct, 'kind' | 'piecesPerSquareMetre'>, pieces: number) =>
    describeQuantity({ group: product.kind, unit: product.kind === 'cement' ? 'bags' : 'pcs', piecesPerSquareMetre: product.piecesPerSquareMetre }, pieces)

/** The total of the lines that have a product and a usable quantity. Lines still being typed count as nothing. */
export function saleTotal(rows: { productId: string; quantity: string }[], catalog: SaleCatalog): number {
    return round2(
        rows.reduce((sum, row) => {
            const product = catalog[row.productId]
            const quantity = parseDecimal(row.quantity)
            return product && quantity !== null && quantity > 0 ? sum + lineAmount(product.price, quantity) : sum
        }, 0),
    )
}

export function paymentStatusOf(total: number, paid: number): PaymentStatus {
    if (paid >= total) return 'paid'
    return paid > 0 ? 'partial' : 'unpaid'
}

export const unitWord = (unit: SaleUnit) => (unit === 'm2' ? 'm²' : unit === 'bags' ? 'bags' : 'pcs')
export const perUnit = (unit: SaleUnit) => (unit === 'm2' ? 'per m²' : unit === 'bags' ? 'per bag' : 'per piece')

/** "20 bags Dangote 3X cement 50kg". */
export const describeLine = (line: Pick<SaleLine, 'quantity' | 'unit' | 'productName'>) => `${line.quantity.toLocaleString('en-NG')} ${unitWord(line.unit)} ${line.productName}`