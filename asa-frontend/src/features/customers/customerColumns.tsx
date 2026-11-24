import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import { ActiveBadge } from '@/components/ui'
import { ContactCell, CustomerActions, CustomerName, OwesCell, type CustomerActionHandlers } from './CustomerParts'
import type { Customer } from './types'

const col = listColumns<Customer>()

export function useCustomerColumns(handlers: CustomerActionHandlers, canDeactivate: boolean, canSeeMoney: boolean) {
    const { onEdit, onToggleActive } = handlers
    return useMemo(
        () =>
            col.columns([
                col.accessor('name', { header: 'Customer', cell: ({ row }) => <CustomerName customer={row.original} /> }),
                col.display({ id: 'contact', header: 'Contact', cell: ({ row }) => <ContactCell customer={row.original} /> }),
                col.accessor('address', { header: 'Address', enableSorting: false, cell: ({ getValue }) => <span className="text-ink-700">{getValue() || '—'}</span> }),
                ...(canSeeMoney
                    ? [col.accessor('balanceOwed', { header: 'Owes', meta: { align: 'right' }, cell: ({ row }) => <OwesCell customer={row.original} /> })]
                    : []),
                col.display({ id: 'status', header: 'Status', cell: ({ row }) => <ActiveBadge active={row.original.active} /> }),
                col.display({
                    id: 'actions',
                    header: () => <span className="sr-only">Actions</span>,
                    meta: { className: 'w-px whitespace-nowrap' },
                    cell: ({ row }) => <CustomerActions customer={row.original} canDeactivate={canDeactivate} onEdit={onEdit} onToggleActive={onToggleActive} />,
                }),
            ]),
        [onEdit, onToggleActive, canDeactivate, canSeeMoney],
    )
}