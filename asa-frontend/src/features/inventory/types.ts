import type { Unit } from '@/lib/format'

/** Blocks, interlocks and cement are products; raw materials are what production uses up. */
export type StockGroup = 'block' | 'interlock' | 'cement' | 'material'

/** One thing that is counted in the yard, whether it is a product or a raw material. */
export interface StockItem {
    /** "product:p-3" or "material:m-1". Products and materials have separate id spaces. */
    id: string
    code: string
    name: string
    group: StockGroup
    /** What the stock is counted in. Interlocks are counted in pieces, not square metres. */
    unit: Unit
    stock: number
    reorderLevel: number
    /** Interlocks only. */
    piecesPerSquareMetre: number | null
    active: boolean
}

export interface StockSummary {
    items: number
    /** At or below the minimum level, but not empty. */
    low: number
    out: number
}

export type MovementType = 'opening' | 'production' | 'purchase' | 'sale' | 'usage' | 'adjustment'

export interface StockMovement {
    id: string
    itemId: string
    itemCode: string
    itemName: string
    group: StockGroup
    unit: Unit
    piecesPerSquareMetre: number | null
    type: MovementType
    /** Positive when stock went up, negative when it went down. In the item's own unit. */
    quantity: number
    balanceAfter: number
    /** The document behind the movement, for example a sale or a production batch. */
    reference: string | null
    detail: string
    performedBy: string
    createdAt: string
}

export type AdjustmentDirection = 'in' | 'out'
export type AdjustmentReason = 'count' | 'damaged' | 'lost' | 'returned' | 'other'

export interface AdjustmentInput {
    itemId: string
    direction: AdjustmentDirection
    quantity: number
    reason: AdjustmentReason
    note: string
}