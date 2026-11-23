import { History } from 'lucide-react'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { Button, PageHeader } from '@/components/ui'
import { ChangeCell, DetailsCell, InventoryTabs, MovementTypeBadge } from '@/features/inventory/InventoryParts'
import { movementColumns } from '@/features/inventory/movementColumns'
import { describeQuantity, GROUP_LABELS, GROUPS, MOVEMENT_LABELS, MOVEMENT_TYPES } from '@/features/inventory/units'
import { useMovements } from '@/features/inventory/useInventory'
import { formatDateTime } from '@/lib/format'
import { useListParams } from '@/hooks/useListParams'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['createdAt', 'itemName'],
    // The item is an id such as "product:p-3", so it is matched by shape rather than from a list.
    filters: { type: MOVEMENT_TYPES, group: GROUPS, item: /^(product|material):[\w-]+$/ },
    defaultSort: { id: 'createdAt', desc: true },
}

export function MovementsPage() {
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useMovements(params)
    const itemId = params.filters.item
    const itemName = query.data?.items[0]?.itemName

    return (
        <>
            <PageHeader title="Inventory" description="What is in stock now, and what changed it" />
            <InventoryTabs />

            {itemId && (
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-text-muted">Showing the history of</span>
                    <span className="font-medium">{itemName ?? 'this item'}</span>
                    <Button variant="ghost" size="sm" onClick={() => list.setFilter('item', null)}>
                        Show all items
                    </Button>
                </div>
            )}

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search movements" placeholder="Search item, reference or details" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by type"
                    allLabel="All types"
                    value={params.filters.type ?? ''}
                    options={MOVEMENT_TYPES.map((t) => ({ value: t, label: MOVEMENT_LABELS[t].label }))}
                    onChange={(v) => list.setFilter('type', v)}
                />
                <FilterSelect
                    label="Filter by group"
                    allLabel="All groups"
                    value={params.filters.group ?? ''}
                    options={GROUPS.map((g) => ({ value: g, label: GROUP_LABELS[g] }))}
                    onChange={(v) => list.setFilter('group', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Stock movements"
                noun="movements"
                columns={movementColumns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(movement) => movement.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: History,
                    title: 'No movements yet',
                    description: 'Every change to stock, from production to sales and corrections, is listed here.',
                }}
                mobileCard={(movement) => (
                    <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-medium">{movement.itemName}</p>
                                <p className="text-xs text-text-muted">{formatDateTime(movement.createdAt)}</p>
                            </div>
                            <MovementTypeBadge movement={movement} />
                        </div>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-text-muted">Change</dt>
                                <dd className="mt-0.5">
                                    <ChangeCell movement={movement} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-text-muted">Balance after</dt>
                                <dd className="num mt-0.5">{describeQuantity(movement, movement.balanceAfter)}</dd>
                            </div>
                        </dl>
                        <DetailsCell movement={movement} />
                        <p className="text-xs text-text-muted">By {movement.performedBy}</p>
                    </div>
                )}
            />
        </>
    )
}