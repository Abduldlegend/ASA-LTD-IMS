import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import type { Product } from './types'
import { ActiveBadge, PriceCell, ProductActions, StockCell, type ProductActionHandlers } from './ProductParts'
import { KIND_LABELS } from './units'

const col = listColumns<Product>()

export function useProductColumns(handlers: ProductActionHandlers, canManage: boolean) {
    const { onEdit, onToggleActive } = handlers
    return useMemo(() => {
        // Staff see the catalogue but cannot change it, so they get no action buttons.
        const actions = col.display({
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            meta: { className: 'w-px whitespace-nowrap' },
            cell: ({ row }) => <ProductActions product={row.original} onEdit={onEdit} onToggleActive={onToggleActive} />,
        })
        return col.columns([
            col.accessor('name', {
                header: 'Product',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">{row.original.name}</p>
                        <p className="num text-xs text-text-muted">{row.original.code}</p>
                    </div>
                ),
            }),
            col.accessor('categoryName', {
                header: 'Category',
                cell: ({ row }) => (
                    <div>
                        <p>{row.original.categoryName}</p>
                        <p className="text-xs text-text-muted">{KIND_LABELS[row.original.kind]}</p>
                    </div>
                ),
            }),
            col.accessor('price', { header: 'Price', meta: { align: 'right' }, cell: ({ row }) => <PriceCell product={row.original} /> }),
            col.accessor('stock', { header: 'In stock', meta: { align: 'right' }, cell: ({ row }) => <StockCell product={row.original} /> }),
            col.display({ id: 'status', header: 'Status', cell: ({ row }) => <ActiveBadge product={row.original} /> }),
            ...(canManage ? [actions] : []),
        ])
    }, [onEdit, onToggleActive, canManage])
}