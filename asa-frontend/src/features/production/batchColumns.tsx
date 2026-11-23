import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import { BatchActions, BatchName, BatchStatusCell, CostCell, OutcomeCell, ProductCell, type BatchActionHandlers } from './ProductionParts'
import type { ProductionBatch } from './types'
import { describePieces } from './units'

const col = listColumns<ProductionBatch>()

export function useBatchColumns({ onView, onComplete }: BatchActionHandlers, canSeeMoney: boolean) {
    return useMemo(
        () =>
            col.columns([
                col.accessor('producedOn', { header: 'Batch', cell: ({ row }) => <BatchName batch={row.original} /> }),
                col.accessor('productName', { header: 'Product', cell: ({ row }) => <ProductCell batch={row.original} /> }),
                col.accessor('quantityProduced', {
                    header: 'Made',
                    meta: { align: 'right' },
                    cell: ({ row }) => <span className="num">{describePieces(row.original, row.original.quantityProduced)}</span>,
                }),
                col.display({ id: 'outcome', header: 'Ready for sale', meta: { align: 'right' }, cell: ({ row }) => <OutcomeCell batch={row.original} /> }),
                col.display({ id: 'status', header: 'Status', cell: ({ row }) => <BatchStatusCell batch={row.original} /> }),
                ...(canSeeMoney
                    ? [col.display({ id: 'cost', header: 'Material cost', meta: { align: 'right' }, cell: ({ row }) => <CostCell batch={row.original} /> })]
                    : []),
                col.display({
                    id: 'actions',
                    header: () => <span className="sr-only">Actions</span>,
                    meta: { className: 'w-px whitespace-nowrap' },
                    cell: ({ row }) => <BatchActions batch={row.original} onView={onView} onComplete={onComplete} />,
                }),
            ]),
        [onView, onComplete, canSeeMoney],
    )
}