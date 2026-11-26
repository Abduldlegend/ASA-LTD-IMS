import { Badge, Button, StatusBadge } from '@/components/ui'
import { describeLine } from '@/features/sales/units'
import { formatDate, formatNaira } from '@/lib/format'
import type { Order } from './types'
import { isDueToday, isOverdue } from './units'

export function OrderName({ order }: { order: Order }) {
    return (
        <div>
            <p className="num font-medium">{order.code}</p>
            <p className="text-xs text-text-muted">Ordered {formatDate(order.orderedOn)}</p>
        </div>
    )
}

export function ItemsCell({ order }: { order: Order }) {
    const [first, ...rest] = order.lines
    return (
        <div>
            <p>{describeLine(first)}</p>
            {rest.length > 0 && <p className="text-xs text-text-muted">+ {rest.length} more {rest.length === 1 ? 'item' : 'items'}</p>}
        </div>
    )
}

/** The day the customer wants it, flagged when it is late or due today. */
export function NeededByCell({ order }: { order: Order }) {
    return (
        <div className="flex flex-col items-start gap-1">
            <span className="num">{formatDate(order.neededBy)}</span>
            {isOverdue(order) && <Badge tone="danger">Overdue</Badge>}
            {isDueToday(order) && <Badge tone="warning">Due today</Badge>}
        </div>
    )
}

export function StatusCell({ order }: { order: Order }) {
    return (
        <div className="flex flex-col items-start gap-1">
            <StatusBadge group="order" status={order.status} />
            {order.saleCode && <span className="num text-xs text-text-muted">Sale {order.saleCode}</span>}
        </div>
    )
}

export function TotalCell({ order }: { order: Order }) {
    return <span className="num">{formatNaira(order.estimatedTotal)}</span>
}

export interface OrderActionHandlers {
    onView: (order: Order) => void
    onFulfil: (order: Order) => void
}

export function OrderActions({ order, onView, onFulfil }: OrderActionHandlers & { order: Order }) {
    return (
        <div className="flex justify-end gap-1">
            {order.status === 'pending' && (
                <Button variant="outline" size="sm" onClick={() => onFulfil(order)} aria-label={`Fulfil ${order.code}`}>
                    Fulfil
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onView(order)} aria-label={`View ${order.code}`}>
                View
            </Button>
        </div>
    )
}