import { Badge, Button } from '@/components/ui'
import { formatNaira } from '@/lib/format'
import type { Customer } from './types'

export function CustomerName({ customer }: { customer: Customer }) {
    return (
        <div>
            <p className="font-medium">{customer.name}</p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                <span className="num">{customer.code}</span>
                <Badge tone={customer.type === 'business' ? 'info' : 'neutral'}>{customer.type === 'business' ? 'Business' : 'Individual'}</Badge>
            </p>
        </div>
    )
}

/** Who to call: the contact person at a business, and the phone number, which opens the dialler on a phone. */
export function ContactCell({ customer }: { customer: Customer }) {
    return (
        <div>
            {customer.contactPerson && <p>{customer.contactPerson}</p>}
            <a href={`tel:${customer.phone.replace(/[\s-]/g, '')}`} className="num text-xs text-text-muted underline-offset-2 hover:underline">
                {customer.phone}
            </a>
        </div>
    )
}

/** What the customer owes. Nothing is shown to people who may not see money, and nothing owed is a quiet dash. */
export function OwesCell({ customer }: { customer: Customer }) {
    if (customer.balanceOwed === null) return null
    return customer.balanceOwed > 0 ? <span className="num font-medium">{formatNaira(customer.balanceOwed)}</span> : <span className="text-text-muted">—</span>
}

export interface CustomerActionHandlers {
    onEdit: (customer: Customer) => void
    onToggleActive: (customer: Customer) => void
}

export function CustomerActions({ customer, canDeactivate, onEdit, onToggleActive }: CustomerActionHandlers & { customer: Customer; canDeactivate: boolean }) {
    return (
        <div className="flex justify-end gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(customer)} aria-label={`Edit ${customer.name}`}>
                Edit
            </Button>
            {canDeactivate && (
                <Button variant="ghost" size="sm" onClick={() => onToggleActive(customer)} aria-label={`${customer.active ? 'Deactivate' : 'Reactivate'} ${customer.name}`}>
                    {customer.active ? 'Deactivate' : 'Reactivate'}
                </Button>
            )}
        </div>
    )
}