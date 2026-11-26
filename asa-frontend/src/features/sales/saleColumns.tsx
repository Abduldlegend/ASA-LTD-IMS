import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import { CustomerCell, ItemsCell, PaymentCell, SaleActions, SaleName, TotalCell, type SaleActionHandlers } from './SaleParts'
import type { Sale } from './types'

const col = listColumns<Sale>()

export function useSaleColumns({ onView, onPay }: SaleActionHandlers) {
    return useMemo(
        () =>
            col.columns([
                col.accessor('soldOn', { header: 'Sale', cell: ({ row }) => <SaleName sale={row.original} /> }),
                col.accessor('customerName', { header: 'Customer', cell: ({ row }) => <CustomerCell sale={row.original} /> }),
                col.display({ id: 'items', header: 'Items', cell: ({ row }) => <ItemsCell sale={row.original} /> }),
                col.accessor('total', { header: 'Total', meta: { align: 'right' }, cell: ({ row }) => <TotalCell sale={row.original} /> }),
                col.display({ id: 'payment', header: 'Payment', cell: ({ row }) => <PaymentCell sale={row.original} /> }),
                col.display({
                    id: 'actions',
                    header: () => <span className="sr-only">Actions</span>,
                    meta: { className: 'w-px whitespace-nowrap' },
                    cell: ({ row }) => <SaleActions sale={row.original} onView={onView} onPay={onPay} />,
                }),
            ]),
        [onView, onPay],
    )
}