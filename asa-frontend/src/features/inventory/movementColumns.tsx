import { listColumns } from '@/components/data-table'
import { formatDateTime } from '@/lib/format'
import type { StockMovement } from './types'
import { ChangeCell, DetailsCell, MovementTypeBadge } from './InventoryParts'
import { describeQuantity } from './units'

const col = listColumns<StockMovement>()

export const movementColumns = col.columns([
    col.accessor('createdAt', { header: 'When', cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span> }),
    col.accessor('itemName', {
        header: 'Item',
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.itemName}</p>
                <p className="num text-xs text-text-muted">{row.original.itemCode}</p>
            </div>
        ),
    }),
    col.accessor('type', { header: 'Type', enableSorting: false, cell: ({ row }) => <MovementTypeBadge movement={row.original} /> }),
    col.accessor('quantity', { header: 'Change', enableSorting: false, meta: { align: 'right' }, cell: ({ row }) => <ChangeCell movement={row.original} /> }),
    col.accessor('balanceAfter', {
        header: 'Balance after',
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => <span className="num">{describeQuantity(row.original, row.original.balanceAfter)}</span>,
    }),
    col.display({ id: 'details', header: 'Details', cell: ({ row }) => <DetailsCell movement={row.original} /> }),
    col.accessor('performedBy', { header: 'By', enableSorting: false }),
])