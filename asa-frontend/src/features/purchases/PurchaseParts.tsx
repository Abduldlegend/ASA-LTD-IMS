import { Button, StatusBadge } from '@/components/ui'
import { formatDate, formatNaira } from '@/lib/format'
import type { Purchase } from './types'
import { describeLine } from './units'

export function PurchaseName({ purchase }: { purchase: Purchase }) {
    return (
        <div>
            <p className="num font-medium">{purchase.code}</p>
            <p className="text-xs text-text-muted">{formatDate(purchase.purchasedOn)}</p>
        </div>
    )
}

export function SupplierCell({ purchase }: { purchase: Purchase }) {
    return (
        <div>
            <p>{purchase.supplierName}</p>
            {purchase.reference && <p className="num text-xs text-text-muted">Ref {purchase.reference}</p>}
        </div>
    )
}

export function ItemsCell({ purchase }: { purchase: Purchase }) {
    const [first, ...rest] = purchase.lines
    return (
        <div>
            <p>{describeLine(first)}</p>
            {rest.length > 0 && <p className="text-xs text-text-muted">+ {rest.length} more {rest.length === 1 ? 'item' : 'items'}</p>}
        </div>
    )
}

/** The cost, or a note that it has not been priced yet. */
export function TotalCell({ purchase }: { purchase: Purchase }) {
    return purchase.total === null ? <span className="text-xs text-text-muted">Not priced</span> : <span className="num font-medium">{formatNaira(purchase.total)}</span>
}

/** Whether the supplier has been paid, and what is still owed. Nothing until the purchase is approved. */
export function PaymentCell({ purchase }: { purchase: Purchase }) {
    if (purchase.status !== 'approved' || purchase.paymentStatus === null) return <span className="text-text-muted">—</span>
    return (
        <div className="flex flex-col items-start gap-1">
            <StatusBadge group="payment" status={purchase.paymentStatus} />
            {purchase.balance !== null && purchase.balance > 0 && <span className="num text-xs text-text-muted">{formatNaira(purchase.balance)} owed</span>}
        </div>
    )
}

export function StatusCell({ purchase }: { purchase: Purchase }) {
    return <StatusBadge group="approval" status={purchase.status} />
}

export interface PurchaseActionHandlers {
    onView: (purchase: Purchase) => void
    onApprove: (purchase: Purchase) => void
}

export function PurchaseActions({ purchase, canApprove, onView, onApprove }: PurchaseActionHandlers & { purchase: Purchase; canApprove: boolean }) {
    return (
        <div className="flex justify-end gap-1">
            {canApprove && purchase.status === 'pending' && (
                <Button variant="outline" size="sm" onClick={() => onApprove(purchase)} aria-label={`Price and approve ${purchase.code}`}>
                    Approve
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onView(purchase)} aria-label={`View ${purchase.code}`}>
                View
            </Button>
        </div>
    )
}