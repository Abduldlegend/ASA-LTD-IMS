import { Button, StatusBadge } from '@/components/ui'
import { stockState } from '@/features/products/units'
import { formatNaira } from '@/lib/format'
import type { RawMaterial } from './types'
import { describeCost, describeStock, stockValue } from './units'

export function StockCell({ material }: { material: RawMaterial }) {
    const state = stockState(material)
    return (
        <div className="flex flex-col items-end gap-1">
            <span className="num">{describeStock(material)}</span>
            {state !== 'ok' && <StatusBadge group="stock" status={state} />}
        </div>
    )
}

export function CostCell({ material }: { material: RawMaterial }) {
    const text = describeCost(material)
    return text === null ? null : <span className="num">{text}</span>
}

export function ValueCell({ material }: { material: RawMaterial }) {
    const value = stockValue(material)
    return value === null ? null : <span className="num">{formatNaira(value)}</span>
}

export interface RawMaterialActionHandlers {
    onEdit: (material: RawMaterial) => void
    onToggleActive: (material: RawMaterial) => void
}

export function RawMaterialActions({ material, onEdit, onToggleActive }: RawMaterialActionHandlers & { material: RawMaterial }) {
    return (
        <div className="flex justify-end gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(material)} aria-label={`Edit ${material.name}`}>
                Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onToggleActive(material)} aria-label={`${material.active ? 'Deactivate' : 'Reactivate'} ${material.name}`}>
                {material.active ? 'Deactivate' : 'Reactivate'}
            </Button>
        </div>
    )
}