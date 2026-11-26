import { Button, StatusBadge } from '@/components/ui'
import { formatDate, formatNaira } from '@/lib/format'
import type { Sale } from './types'
import { describeLine } from './units'

export function SaleName({ sale }: { sale: Sale }) {
    return (
        <div>
            <p className="num font-medium">{sale.code}</p>
            <p className="text-xs text-text-muted">{formatDate(sale.soldOn)}</p>
        </div>
    )
}

export function CustomerCell({ sale }: { sale: Sale }) {
    return <span className={sale.customerId ? undefined : 'text-text-muted'}>{sale.customerName}</span>
}

export function ItemsCell({ sale }: { sale: Sale }) {
    const [first, ...rest] = sale.lines
    return (
        <div>
            <p>{describeLine(first)}</p>
            {rest.length > 0 && <p className="text-xs text-text-muted">+ {rest.length} more {rest.length === 1 ? 'item' : 'items'}</p>}
        </div>
    )
}

export function TotalCell({ sale }: { sale: Sale }) {
    return <span className="num font-medium">{formatNaira(sale.total)}</span>
}

/** Paid, part paid or unpaid, and what is still owed. A cancelled sale says so instead. */
export function PaymentCell({ sale }: { sale: Sale }) {
    if (sale.status === 'cancelled') return <StatusBadge group="sale" status="cancelled" />
    return (
        <div className="flex flex-col items-start gap-1">
            <StatusBadge group="payment" status={sale.paymentStatus} />
            {sale.balance > 0 && <span className="num text-xs text-text-muted">{formatNaira(sale.balance)} owed</span>}
        </div>
    )
}

export interface SaleActionHandlers {
    onView: (sale: Sale) => void
    onPay: (sale: Sale) => void
}

export function SaleActions({ sale, onView, onPay }: SaleActionHandlers & { sale: Sale }) {
    const canPay = sale.status === 'completed' && sale.balance > 0
    return (
        <div className="flex justify-end gap-1">
            {canPay && (
                <Button variant="outline" size="sm" onClick={() => onPay(sale)} aria-label={`Record payment for ${sale.code}`}>
                    Record payment
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onView(sale)} aria-label={`View ${sale.code}`}>
                View
            </Button>
        </div>
    )
}