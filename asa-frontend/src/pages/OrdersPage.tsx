import { ClipboardList, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { Button, ConfirmDialog, KpiTile, PageHeader } from '@/components/ui'
import { OrderDetailsModal } from '@/features/orders/OrderDetailsModal'
import { OrderFormModal } from '@/features/orders/OrderFormModal'
import { ItemsCell, NeededByCell, OrderActions, OrderName, StatusCell, TotalCell } from '@/features/orders/OrderParts'
import { useOrderColumns } from '@/features/orders/orderColumns'
import type { Order } from '@/features/orders/types'
import { useCancelOrder, useFulfilOrder, useOrderList, useOrderSummary } from '@/features/orders/useOrders'
import { NewSaleModal } from '@/features/sales/NewSaleModal'
import { useListParams } from '@/hooks/useListParams'
import { toApiError } from '@/lib/apiError'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['orderedOn', 'neededBy', 'code', 'customerName', 'estimatedTotal'],
    filters: { status: ['pending', 'fulfilled', 'cancelled'], due: ['overdue'] },
    defaultSort: { id: 'neededBy', desc: false },
}

type Dialog = { kind: 'new' } | { kind: 'view'; order: Order } | { kind: 'edit'; order: Order } | { kind: 'fulfil'; order: Order } | { kind: 'cancel'; order: Order } | null

export function OrdersPage() {
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useOrderList(params)
    const summary = useOrderSummary()
    const cancel = useCancelOrder()
    const fulfil = useFulfilOrder()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onView = useCallback((order: Order) => setDialog({ kind: 'view', order }), [])
    const onFulfil = useCallback((order: Order) => setDialog({ kind: 'fulfil', order }), [])
    const columns = useOrderColumns({ onView, onFulfil })
    const closeDialog = () => setDialog(null)

    const confirmCancel = async (order: Order) => {
        try {
            await cancel.mutateAsync(order.id)
            toast.success(`${order.code} was cancelled`)
        } catch (e) {
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    const s = summary.data
    const figure = (n?: number) => (n === undefined ? '—' : n.toLocaleString('en-NG'))
    const cancelTarget = dialog?.kind === 'cancel' ? dialog.order : null

    return (
        <>
            <PageHeader
                title="Orders"
                description="What customers have asked for, and when they need it"
                actions={
                    <Button onClick={() => setDialog({ kind: 'new' })}>
                        <Plus className="size-4" aria-hidden /> New order
                    </Button>
                }
            />

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <KpiTile label="Open orders" value={figure(s?.open)} note="Waiting to be fulfilled" />
                <KpiTile label="Due today" value={figure(s?.dueToday)} note="Customers expecting them" />
                <KpiTile label="Overdue" value={figure(s?.overdue)} note="Past the date they were needed" />
            </div>

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search orders" placeholder="Search order number, customer or product" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by status"
                    allLabel="All orders"
                    value={params.filters.status ?? ''}
                    options={[
                        { value: 'pending', label: 'Open' },
                        { value: 'fulfilled', label: 'Fulfilled' },
                        { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    onChange={(v) => list.setFilter('status', v)}
                />
                <FilterSelect
                    label="Filter by timing"
                    allLabel="Any date"
                    value={params.filters.due ?? ''}
                    options={[{ value: 'overdue', label: 'Overdue' }]}
                    onChange={(v) => list.setFilter('due', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Orders"
                noun="orders"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(order) => order.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: ClipboardList,
                    title: 'No orders yet',
                    description: 'Write down what a customer asks for and when they need it. When you supply it, fulfil the order and it becomes a sale.',
                    action: <Button onClick={() => setDialog({ kind: 'new' })}>New order</Button>,
                }}
                mobileCard={(order) => (
                    <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                            <OrderName order={order} />
                            <TotalCell order={order} />
                        </div>
                        <p>{order.customerName}</p>
                        <ItemsCell order={order} />
                        <NeededByCell order={order} />
                        <StatusCell order={order} />
                        <OrderActions order={order} onView={onView} onFulfil={onFulfil} />
                    </div>
                )}
            />

            {(dialog?.kind === 'new' || dialog?.kind === 'edit') && <OrderFormModal order={dialog.kind === 'edit' ? dialog.order : undefined} onClose={closeDialog} />}
            {dialog?.kind === 'view' && (
                <OrderDetailsModal
                    order={dialog.order}
                    onFulfil={onFulfil}
                    onEdit={(order) => setDialog({ kind: 'edit', order })}
                    onCancelOrder={(order) => setDialog({ kind: 'cancel', order })}
                    onClose={closeDialog}
                />
            )}
            {dialog?.kind === 'fulfil' && (
                <NewSaleModal
                    onClose={closeDialog}
                    prefill={{ title: `Fulfil ${dialog.order.code}`, customerId: dialog.order.customerId, customerName: dialog.order.customerName, lines: dialog.order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }}
                    submit={(input) => fulfil.mutateAsync({ id: dialog.order.id, input })}
                />
            )}

            <ConfirmDialog
                open={cancelTarget !== null}
                tone="danger"
                title="Cancel this order?"
                confirmLabel="Cancel order"
                loading={cancel.isPending}
                onCancel={closeDialog}
                onConfirm={() => cancelTarget && confirmCancel(cancelTarget)}
            >
                {cancelTarget && <p>{cancelTarget.code} for {cancelTarget.customerName} will be cancelled. Nothing has left stock for it, so nothing needs putting back.</p>}
            </ConfirmDialog>
        </>
    )
}