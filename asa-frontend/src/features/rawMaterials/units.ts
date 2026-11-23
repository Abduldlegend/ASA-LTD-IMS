import { formatNaira, formatQuantity, unitLabel } from '@/lib/format'
import type { MaterialUnit, RawMaterial } from './types'

export const MATERIAL_UNITS: MaterialUnit[] = ['bags', 'trips', 'litres']

export const UNIT_NAMES: Record<MaterialUnit, string> = { bags: 'Bags', trips: 'Trips', litres: 'Litres' }
const SINGULAR: Record<MaterialUnit, string> = { bags: 'bag', trips: 'trip', litres: 'litre' }

export const costLabel = (unit: MaterialUnit) => `Cost per ${SINGULAR[unit]}`
export const reorderLabel = (unit: MaterialUnit) => `Minimum stock level (${unitLabel(unit)})`

/** "480 bags", "7.5 trips", and "1 trip" (not "1 trips"). */
export const describeStock = (m: Pick<RawMaterial, 'stock' | 'unit'>) =>
    m.stock === 1 && m.unit !== 'litres' ? `1 ${SINGULAR[m.unit]}` : formatQuantity(m.stock, m.unit)

/** "₦9,200.00 / bag". Null when the person may not see costs. */
export const describeCost = (m: Pick<RawMaterial, 'unitCost' | 'unit'>) =>
    m.unitCost === null ? null : `${formatNaira(m.unitCost)} / ${SINGULAR[m.unit]}`

/** What the stock on hand is worth at the latest cost. Null when the person may not see costs. */
export const stockValue = (m: Pick<RawMaterial, 'unitCost' | 'stock'>) => (m.unitCost === null ? null : Math.round(m.unitCost * m.stock * 100) / 100)