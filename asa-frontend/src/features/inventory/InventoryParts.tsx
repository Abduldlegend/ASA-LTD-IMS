import { Link } from 'react-router-dom'
import { Badge, Button, SectionTabs, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/cn'
import { stockState } from '@/features/products/units'
import type { StockItem, StockMovement } from './types'
import { describeChange, describeQuantity, historyLink, MOVEMENT_LABELS } from './units'

export function InventoryTabs() {
    return (
        <SectionTabs
            label="Inventory sections"
            tabs={[
                { to: '/inventory', label: 'Stock', end: true },
                { to: '/inventory/movements', label: 'Movements' },
            ]}
        />
    )
}

/** The stock figure, with a badge when it is low or gone. Interlocks also show the area the pieces cover. */
export function ItemStockCell({ item }: { item: StockItem }) {
    const state = stockState(item)
    return (
        <div className="flex flex-col items-end gap-1">
            <span className="num">{describeQuantity(item, item.stock)}</span>
            {state !== 'ok' && <StatusBadge group="stock" status={state} />}
        </div>
    )
}

export function ItemName({ item }: { item: StockItem }) {
    return (
        <div>
            <p className="font-medium">
                {item.name}
                {!item.active && <Badge className="ml-2">Inactive</Badge>}
            </p>
            <p className="num text-xs text-text-muted">{item.code}</p>
        </div>
    )
}

export interface StockActionHandlers {
    onAdjust: (item: StockItem) => void
}

export function StockActions({ item, canAdjust, onAdjust }: StockActionHandlers & { item: StockItem; canAdjust: boolean }) {
    return (
        <div className="flex justify-end gap-1">
            <Link
                to={historyLink(item.id)}
                aria-label={`History of ${item.name}`}
                className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
                History
            </Link>
            {canAdjust && (
                <Button variant="outline" size="sm" onClick={() => onAdjust(item)} aria-label={`Adjust stock of ${item.name}`}>
                    Adjust
                </Button>
            )}
        </div>
    )
}

export function MovementTypeBadge({ movement }: { movement: StockMovement }) {
    const { label, tone } = MOVEMENT_LABELS[movement.type]
    return <Badge tone={tone}>{label}</Badge>
}

/** "+320 pcs" in green, "−120 pcs" in red. The sign is in the text, so colour is only a hint. */
export function ChangeCell({ movement }: { movement: StockMovement }) {
    return (
        <span className={cn('num font-medium', movement.quantity < 0 ? 'text-danger-600' : 'text-success-600')}>
            {describeChange(movement, movement.quantity)}
        </span>
    )
}

export function DetailsCell({ movement }: { movement: StockMovement }) {
    return (
        <div>
            <p className="text-ink-700">{movement.detail}</p>
            {movement.reference && <p className="num text-xs text-text-muted">{movement.reference}</p>}
        </div>
    )
}