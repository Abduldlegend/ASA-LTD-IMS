import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import { ActiveBadge } from '@/components/ui'
import type { RawMaterial } from './types'
import { CostCell, RawMaterialActions, StockCell, ValueCell, type RawMaterialActionHandlers } from './RawMaterialParts'

const col = listColumns<RawMaterial>()

export function useRawMaterialColumns(handlers: RawMaterialActionHandlers, canManage: boolean, canSeeMoney: boolean) {
    const { onEdit, onToggleActive } = handlers
    return useMemo(() => {
        const money = [
            col.accessor('unitCost', { header: 'Cost', meta: { align: 'right' }, cell: ({ row }) => <CostCell material={row.original} /> }),
            col.display({ id: 'value', header: 'Stock value', meta: { align: 'right' }, cell: ({ row }) => <ValueCell material={row.original} /> }),
        ]
        const actions = col.display({
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            meta: { className: 'w-px whitespace-nowrap' },
            cell: ({ row }) => <RawMaterialActions material={row.original} onEdit={onEdit} onToggleActive={onToggleActive} />,
        })
        return col.columns([
            col.accessor('name', {
                header: 'Material',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">{row.original.name}</p>
                        <p className="num text-xs text-text-muted">{row.original.code}</p>
                    </div>
                ),
            }),
            col.accessor('stock', { header: 'In stock', meta: { align: 'right' }, cell: ({ row }) => <StockCell material={row.original} /> }),
            ...(canSeeMoney ? money : []),
            col.display({ id: 'status', header: 'Status', cell: ({ row }) => <ActiveBadge active={row.original.active} /> }),
            ...(canManage ? [actions] : []),
        ])
    }, [onEdit, onToggleActive, canManage, canSeeMoney])
}