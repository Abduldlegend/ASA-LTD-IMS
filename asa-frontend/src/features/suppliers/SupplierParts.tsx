import { Button } from '@/components/ui'
import { formatNaira } from '@/lib/format'
import type { Supplier } from './types'

/** Who to call: the contact person and the phone number, which opens the dialler on a phone. */
export function ContactCell({ supplier }: { supplier: Supplier }) {
    return (
        <div>
            {supplier.contactPerson && <p>{supplier.contactPerson}</p>}
            <a href={`tel:${supplier.phone.replace(/[\s-]/g, '')}`} className="num text-xs text-text-muted underline-offset-2 hover:underline">
                {supplier.phone}
            </a>
        </div>
    )
}

export function OwedCell({ supplier }: { supplier: Supplier }) {
    if (supplier.amountOwed === null) return null
    return <span className={supplier.amountOwed > 0 ? 'num font-medium' : 'num text-text-muted'}>{formatNaira(supplier.amountOwed)}</span>
}

export interface SupplierActionHandlers {
    onEdit: (supplier: Supplier) => void
    onToggleActive: (supplier: Supplier) => void
}

export function SupplierActions({ supplier, onEdit, onToggleActive }: SupplierActionHandlers & { supplier: Supplier }) {
    return (
        <div className="flex justify-end gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(supplier)} aria-label={`Edit ${supplier.name}`}>
                Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onToggleActive(supplier)} aria-label={`${supplier.active ? 'Deactivate' : 'Reactivate'} ${supplier.name}`}>
                {supplier.active ? 'Deactivate' : 'Reactivate'}
            </Button>
        </div>
    )
}