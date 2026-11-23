import { Warehouse } from 'lucide-react'
import { useCallback, useState } from 'react'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { KpiTile, PageHeader } from '@/components/ui'
import { canAdjustStock } from '@/config/permissions'
import { AdjustStockModal } from '@/features/inventory/AdjustStockModal'
import { InventoryTabs, ItemName, ItemStockCell, StockActions } from '@/features/inventory/InventoryParts'
import { useStockColumns } from '@/features/inventory/stockColumns'
import type { StockItem } from '@/features/inventory/types'
import { GROUP_LABELS, GROUPS, minimumText } from '@/features/inventory/units'
import { useStockItems, useStockSummary } from '@/features/inventory/useInventory'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['name', 'group', 'stock'],
    filters: { group: GROUPS, stock: ['low'] },
    defaultSort: { id: 'name', desc: false },
}

export function InventoryPage() {
    const canAdjust = canAdjustStock(useCurrentUser().role)
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useStockItems(params)
    const summary = useStockSummary()
    const [adjusting, setAdjusting] = useState<StockItem | null>(null)

    const onAdjust = useCallback((item: StockItem) => setAdjusting(item), [])
    const columns = useStockColumns({ onAdjust }, canAdjust)
    const figure = (n?: number) => (n === undefined ? '—' : String(n))

    return (
        <>
            <PageHeader title="Inventory" description="What is in stock now, and what changed it" />
            <InventoryTabs />

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <KpiTile label="Items tracked" value={figure(summary.data?.items)} note="Products and raw materials" />
                <KpiTile label="Low stock" value={figure(summary.data?.low)} note="At or below the minimum level" />
                <KpiTile label="Out of stock" value={figure(summary.data?.out)} note="Nothing left" />
            </div>

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search stock" placeholder="Search name or code" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by group"
                    allLabel="All groups"
                    value={params.filters.group ?? ''}
                    options={GROUPS.map((g) => ({ value: g, label: GROUP_LABELS[g] }))}
                    onChange={(v) => list.setFilter('group', v)}
                />
                <FilterSelect
                    label="Filter by stock"
                    allLabel="Any stock level"
                    value={params.filters.stock ?? ''}
                    options={[{ value: 'low', label: 'Low or out of stock' }]}
                    onChange={(v) => list.setFilter('stock', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Stock"
                noun="items"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(item) => item.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: Warehouse,
                    title: 'Nothing to count yet',
                    description: 'Add products and raw materials first. They appear here with their stock.',
                }}
                mobileCard={(item) => (
                    <div className="space-y-2.5">
                        <ItemName item={item} />
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-text-muted">In stock</dt>
                                <dd className="mt-0.5 [&>div]:items-start">
                                    <ItemStockCell item={item} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-text-muted">Minimum level</dt>
                                <dd className="num mt-0.5">{minimumText(item)}</dd>
                            </div>
                        </dl>
                        <StockActions item={item} canAdjust={canAdjust} onAdjust={onAdjust} />
                    </div>
                )}
            />

            {adjusting && <AdjustStockModal item={adjusting} onClose={() => setAdjusting(null)} />}
        </>
    )
}