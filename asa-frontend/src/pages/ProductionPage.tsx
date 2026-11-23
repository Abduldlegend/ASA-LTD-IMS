import { Factory, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { Button, KpiTile, PageHeader, StatusBadge } from '@/components/ui'
import { canViewFinancials } from '@/config/permissions'
import { BatchDetailsModal } from '@/features/production/BatchDetailsModal'
import { useBatchColumns } from '@/features/production/batchColumns'
import { CompleteBatchModal } from '@/features/production/CompleteBatchModal'
import { BatchActions, BatchName, BatchStatusCell, CostCell, OutcomeCell, ProductCell } from '@/features/production/ProductionParts'
import { RecordBatchModal } from '@/features/production/RecordBatchModal'
import type { ProductionBatch } from '@/features/production/types'
import { describePieces } from '@/features/production/units'
import { useBatchList, useProductionSummary } from '@/features/production/useProduction'
import { STATUS_MAP } from '@/components/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const STATUSES = ['curing', 'ready', 'rejected'] as const

const SCHEMA: ListSchema = {
    sortable: ['producedOn', 'productName', 'quantityProduced'],
    filters: { status: STATUSES, kind: ['block', 'interlock'] },
    defaultSort: { id: 'producedOn', desc: true },
}

type Dialog = { kind: 'record' } | { kind: 'view'; batch: ProductionBatch } | { kind: 'complete'; batch: ProductionBatch } | null

export function ProductionPage() {
    const canSeeMoney = canViewFinancials(useCurrentUser().role)
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useBatchList(params)
    const summary = useProductionSummary()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onView = useCallback((batch: ProductionBatch) => setDialog({ kind: 'view', batch }), [])
    const onComplete = useCallback((batch: ProductionBatch) => setDialog({ kind: 'complete', batch }), [])
    const columns = useBatchColumns({ onView, onComplete }, canSeeMoney)
    const closeDialog = () => setDialog(null)

    const s = summary.data
    const figure = (n?: number) => (n === undefined ? '—' : n.toLocaleString('en-NG'))
    const rate = s?.rejectedRate == null ? 'No finished batches yet' : `${(s.rejectedRate * 100).toFixed(1)}% of finished pieces`

    return (
        <>
            <PageHeader
                title="Production"
                description="Batches of blocks and interlocks, from the mixer to ready for sale"
                actions={
                    <Button onClick={() => setDialog({ kind: 'record' })}>
                        <Plus className="size-4" aria-hidden /> Record batch
                    </Button>
                }
            />

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <KpiTile label="Under curing" value={figure(s?.curingBatches)} note={s ? `${s.curingPieces.toLocaleString('en-NG')} pieces` : undefined} />
                <KpiTile label="Made this month" value={figure(s?.producedThisMonth)} note="Pieces, all batches" />
                <KpiTile label="Rejected this month" value={figure(s?.rejectedThisMonth)} note={rate} />
            </div>

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search batches" placeholder="Search batch number or product" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by status"
                    allLabel="All statuses"
                    value={params.filters.status ?? ''}
                    options={STATUSES.map((st) => ({ value: st, label: STATUS_MAP.production[st].label }))}
                    onChange={(v) => list.setFilter('status', v)}
                />
                <FilterSelect
                    label="Filter by type"
                    allLabel="Blocks and interlocks"
                    value={params.filters.kind ?? ''}
                    options={[
                        { value: 'block', label: 'Blocks' },
                        { value: 'interlock', label: 'Interlocks' },
                    ]}
                    onChange={(v) => list.setFilter('kind', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Production batches"
                noun="batches"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(batch) => batch.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: Factory,
                    title: 'No batches yet',
                    description: 'Record each batch of blocks or interlocks as it is made. Raw materials are used up and the pieces start curing.',
                    action: <Button onClick={() => setDialog({ kind: 'record' })}>Record batch</Button>,
                }}
                mobileCard={(batch) => (
                    <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                            <BatchName batch={batch} />
                            <StatusBadge group="production" status={batch.status} />
                        </div>
                        <ProductCell batch={batch} />
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-text-muted">Made</dt>
                                <dd className="num mt-0.5">{describePieces(batch, batch.quantityProduced)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-text-muted">Ready for sale</dt>
                                <dd className="mt-0.5 [&>div]:items-start">
                                    <OutcomeCell batch={batch} />
                                </dd>
                            </div>
                            {canSeeMoney && (
                                <div>
                                    <dt className="text-xs text-text-muted">Material cost</dt>
                                    <dd className="mt-0.5">
                                        <CostCell batch={batch} />
                                    </dd>
                                </div>
                            )}
                        </dl>
                        <BatchStatusCell batch={batch} />
                        <BatchActions batch={batch} onView={onView} onComplete={onComplete} />
                    </div>
                )}
            />

            {dialog?.kind === 'record' && <RecordBatchModal onClose={closeDialog} />}
            {dialog?.kind === 'complete' && <CompleteBatchModal batch={dialog.batch} onClose={closeDialog} />}
            {dialog?.kind === 'view' && <BatchDetailsModal batch={dialog.batch} onClose={closeDialog} />}
        </>
    )
}