import { formatNaira, formatQuantity, unitLabel, type Unit } from '@/lib/format'
import { describeInterlockStock, hasRate } from '@/lib/interlock'
import type { Product, ProductKind } from './types'

export const KIND_LABELS: Record<ProductKind, string> = { block: 'Block', interlock: 'Interlock', cement: 'Cement' }
export const KIND_PLURALS: Record<ProductKind, string> = { block: 'Blocks', interlock: 'Interlocks', cement: 'Cement' }
export const KINDS: ProductKind[] = ['block', 'interlock', 'cement']

/** What the customer is charged by. Interlocks are sold in square metres. */
const SALE_UNIT: Record<ProductKind, Unit> = { block: 'pcs', interlock: 'm2', cement: 'bags' }
/** What is counted in the yard. Interlocks are made and stocked in pieces. */
const STOCK_UNIT: Record<ProductKind, Unit> = { block: 'pcs', interlock: 'pcs', cement: 'bags' }

export const saleUnit = (kind: ProductKind) => SALE_UNIT[kind]
export const stockUnit = (kind: ProductKind) => STOCK_UNIT[kind]

export const priceLabel = (kind: ProductKind) =>
    kind === 'interlock' ? 'Price per m²' : kind === 'cement' ? 'Price per bag' : 'Price per piece'

export const reorderLabel = (kind: ProductKind) => `Minimum stock level (${unitLabel(STOCK_UNIT[kind])})`

/** "₦6,500.00 / m²" */
export const describePrice = (product: Pick<Product, 'price' | 'kind'>) =>
    `${formatNaira(product.price)} / ${unitLabel(SALE_UNIT[product.kind])}`

/** Interlock stock shows the pieces and what they cover: "6,400 pcs ≈ 200.00 m²". */
export function describeStock(product: Pick<Product, 'stock' | 'kind' | 'piecesPerSquareMetre'>): string {
    return product.kind === 'interlock'
        ? describeInterlockStock(product.stock, product.piecesPerSquareMetre)
        : formatQuantity(product.stock, STOCK_UNIT[product.kind])
}

export type StockState = 'ok' | 'low' | 'out'

export function stockState(product: Pick<Product, 'stock' | 'reorderLevel'>): StockState {
    if (product.stock <= 0) return 'out'
    if (product.reorderLevel > 0 && product.stock <= product.reorderLevel) return 'low'
    return 'ok'
}

/** An interlock that cannot be sold yet because nobody has given its pieces-per-m² rate. */
export const needsRate = (product: Pick<Product, 'kind' | 'piecesPerSquareMetre'>) =>
    product.kind === 'interlock' && !hasRate(product.piecesPerSquareMetre)