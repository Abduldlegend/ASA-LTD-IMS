import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import type { StockItem } from './types'
import { ItemName, ItemStockCell, StockActions, type StockActionHandlers } from './InventoryParts'
import { GROUP_LABELS, minimumText } from './units'

const col = listColumns<StockItem>()

export function useStockColumns({ onAdjust }: StockActionHandlers, canAdjust: boolean) {
    return useMemo(
        () =>
            col.columns([
                col.accessor('name', { header: 'Item', cell: ({ row }) => <ItemName item={row.original} /> }),
                col.accessor('group', { header: 'Group', cell: ({ row }) => GROUP_LABELS[row.original.group] }),
                col.accessor('stock', { header: 'In stock', meta: { align: 'right' }, cell: ({ row }) => <ItemStockCell item={row.original} /> }),
                col.accessor('reorderLevel', {
                    header: 'Minimum level',
                    enableSorting: false,
                    meta: { align: 'right' },
                    cell: ({ row }) => <span className="num text-text-muted">{minimumText(row.original)}</span>,
                }),
                col.display({
                    id: 'actions',
                    header: () => <span className="sr-only">Actions</span>,
                    meta: { className: 'w-px whitespace-nowrap' },
                    cell: ({ row }) => <StockActions item={row.original} canAdjust={canAdjust} onAdjust={onAdjust} />,
                }),
            ]),
        [onAdjust, canAdjust],
    )
}