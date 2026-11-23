import { formatQuantity, type Unit } from '@/lib/format'
import { describeInterlockStock } from '@/lib/interlock'
import type { AdjustmentDirection, AdjustmentReason, MovementType, StockGroup, StockItem } from './types'
import type { Tone } from '@/components/ui'

export const GROUPS: StockGroup[] = ['block', 'interlock', 'cement', 'material']
export const GROUP_LABELS: Record<StockGroup, string> = { block: 'Blocks', interlock: 'Interlocks', cement: 'Cement', material: 'Raw materials' }

export const MOVEMENT_TYPES: MovementType[] = ['production', 'purchase', 'sale', 'usage', 'adjustment', 'opening']
export const MOVEMENT_LABELS: Record<MovementType, { label: string; tone: Tone }> = {
    opening: { label: 'Opening stock', tone: 'neutral' },
    production: { label: 'Production', tone: 'info' },
    purchase: { label: 'Purchase', tone: 'info' },
    sale: { label: 'Sale', tone: 'neutral' },
    usage: { label: 'Used in production', tone: 'neutral' },
    // A manual correction is the one a manager should notice.
    adjustment: { label: 'Adjustment', tone: 'warning' },
}

export const REASON_LABELS: Record<AdjustmentReason, string> = {
    count: 'Stock count correction',
    damaged: 'Damaged or broken',
    lost: 'Lost or missing',
    returned: 'Returned to stock',
    other: 'Other',
}
export const REASONS_BY_DIRECTION: Record<AdjustmentDirection, AdjustmentReason[]> = {
    in: ['count', 'returned', 'other'],
    out: ['count', 'damaged', 'lost', 'other'],
}

export const round2 = (n: number) => Math.round(n * 100) / 100

const SINGULAR: Partial<Record<Unit, string>> = { bags: 'bag', trips: 'trip' }

/** "480 bags", "7.5 trips", "1 trip". */
export function quantityText(quantity: number, unit: Unit): string {
    return quantity === 1 && SINGULAR[unit] ? `1 ${SINGULAR[unit]}` : formatQuantity(quantity, unit)
}

/** An amount of an item. Interlock pieces also show the area they cover: "320 pcs ≈ 10.00 m²". */
export function describeQuantity(item: Pick<StockItem, 'group' | 'unit' | 'piecesPerSquareMetre'>, quantity: number): string {
    return item.group === 'interlock' ? describeInterlockStock(quantity, item.piecesPerSquareMetre) : quantityText(quantity, item.unit)
}

/** "+320 pcs" or "−120 pcs", with a real minus sign. */
export function describeChange(item: Pick<StockItem, 'group' | 'unit' | 'piecesPerSquareMetre'>, quantity: number): string {
    return `${quantity < 0 ? '−' : '+'}${describeQuantity(item, Math.abs(quantity))}`
}

/** The minimum level, or a dash when none is set. */
export const minimumText = (item: Pick<StockItem, 'group' | 'unit' | 'piecesPerSquareMetre' | 'reorderLevel'>) =>
    item.reorderLevel > 0 ? describeQuantity(item, item.reorderLevel) : '—'

/** The movement history of one item. */
export const historyLink = (itemId: string) => `/inventory/movements?item=${encodeURIComponent(itemId)}`