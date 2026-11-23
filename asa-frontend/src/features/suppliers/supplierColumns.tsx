import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import { ActiveBadge } from '@/components/ui'
import type { Supplier } from './types'
import { ContactCell, OwedCell, SupplierActions, type SupplierActionHandlers } from './SupplierParts'

const col = listColumns<Supplier>()

export function useSupplierColumns(handlers: SupplierActionHandlers, canManage: boolean, canSeeMoney: boolean) {
    const { onEdit, onToggleActive } = handlers
    return useMemo(() => {
        const owed = col.accessor('amountOwed', { header: 'We owe', meta: { align: 'right' }, cell: ({ row }) => <OwedCell supplier={row.original} /> })
        const actions = col.display({
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            meta: { className: 'w-px whitespace-nowrap' },
            cell: ({ row }) => <SupplierActions supplier={row.original} onEdit={onEdit} onToggleActive={onToggleActive} />,
        })
        return col.columns([
            col.accessor('name', {
                header: 'Supplier',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">{row.original.name}</p>
                        <p className="num text-xs text-text-muted">{row.original.code}</p>
                    </div>
                ),
            }),
            col.display({ id: 'contact', header: 'Contact', cell: ({ row }) => <ContactCell supplier={row.original} /> }),
            col.accessor('address', { header: 'Address', enableSorting: false, cell: ({ getValue }) => <span className="text-ink-700">{getValue() || '—'}</span> }),
            ...(canSeeMoney ? [owed] : []),
            col.display({ id: 'status', header: 'Status', cell: ({ row }) => <ActiveBadge active={row.original.active} /> }),
            ...(canManage ? [actions] : []),
        ])
    }, [onEdit, onToggleActive, canManage, canSeeMoney])
}