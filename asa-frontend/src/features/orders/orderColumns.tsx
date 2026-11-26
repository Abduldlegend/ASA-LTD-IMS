import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import { ItemsCell, NeededByCell, OrderActions, OrderName, StatusCell, TotalCell, type OrderActionHandlers } from './OrderParts'
import type { Order } from './types'

const col = listColumns<Order>()

export function useOrderColumns({ onView, onFulfil }: OrderActionHandlers) {
    return useMemo(
        () =>
            col.columns([
                col.accessor('orderedOn', { header: 'Order', cell: ({ row }) => <OrderName order={row.original} /> }),
                col.accessor('customerName', { header: 'Customer' }),
                col.display({ id: 'items', header: 'Items', cell: ({ row }) => <ItemsCell order={row.original} /> }),
                col.accessor('neededBy', { header: 'Needed by', cell: ({ row }) => <NeededByCell order={row.original} /> }),
                col.accessor('estimatedTotal', { header: 'Estimate', meta: { align: 'right' }, cell: ({ row }) => <TotalCell order={row.original} /> }),
                col.display({ id: 'status', header: 'Status', cell: ({ row }) => <StatusCell order={row.original} /> }),
                col.display({
                    id: 'actions',
                    header: () => <span className="sr-only">Actions</span>,
                    meta: { className: 'w-px whitespace-nowrap' },
                    cell: ({ row }) => <OrderActions order={row.original} onView={onView} onFulfil={onFulfil} />,
                }),
            ]),
        [onView, onFulfil],
    )
}