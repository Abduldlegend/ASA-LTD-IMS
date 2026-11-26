import { Plus, Receipt } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { Button, ConfirmDialog, KpiTile, PageHeader } from '@/components/ui'
import { canCancelSales, canViewFinancials } from '@/config/permissions'
import { NewSaleModal } from '@/features/sales/NewSaleModal'
import { RecordPaymentModal } from '@/features/sales/RecordPaymentModal'
import { SaleDetailsModal } from '@/features/sales/SaleDetailsModal'
import { CustomerCell, ItemsCell, PaymentCell, SaleActions, SaleName, TotalCell } from '@/features/sales/SaleParts'
import { useSaleColumns } from '@/features/sales/saleColumns'
import type { Sale } from '@/features/sales/types'
import { useCancelSale, useSaleList, useSalesSummary } from '@/features/sales/useSales'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { toApiError } from '@/lib/apiError'
import { formatNaira } from '@/lib/format'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['soldOn', 'code', 'total', 'customerName'],
    filters: { payment: ['paid', 'partial', 'unpaid'], status: ['completed', 'cancelled'] },
    defaultSort: { id: 'soldOn', desc: true },
}

type Dialog = { kind: 'new' } | { kind: 'view'; sale: Sale } | { kind: 'pay'; sale: Sale } | { kind: 'cancel'; sale: Sale } | null

export function SalesPage() {
    const { role } = useCurrentUser()
    const canSeeTotals = canViewFinancials(role)
    const canCancel = canCancelSales(role)
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useSaleList(params)
    const summary = useSalesSummary(canSeeTotals)
    const cancel = useCancelSale()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onView = useCallback((sale: Sale) => setDialog({ kind: 'view', sale }), [])
    const onPay = useCallback((sale: Sale) => setDialog({ kind: 'pay', sale }), [])
    const columns = useSaleColumns({ onView, onPay })
    const closeDialog = () => setDialog(null)

    const confirmCancel = async (sale: Sale) => {
        try {
            await cancel.mutateAsync(sale.id)
            toast.success(`${sale.code} was cancelled and its stock put back`)
        } catch (e) {
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    const s = summary.data
    const money = (n?: number) => (n === undefined ? '—' : formatNaira(n))
    const cancelTarget = dialog?.kind === 'cancel' ? dialog.sale : null

    return (
        <>
            <PageHeader
                title="Sales"
                description="Blocks, interlocks and cement sold, and what has been paid for"
                actions={
                    <Button onClick={() => setDialog({ kind: 'new' })}>
                        <Plus className="size-4" aria-hidden /> New sale
                    </Button>
                }
            />

            {canSeeTotals && (
                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                    <KpiTile label="Sold today" value={money(s?.soldToday)} note={s ? `${s.salesToday} ${s.salesToday === 1 ? 'sale' : 'sales'}` : undefined} />
                    <KpiTile label="Sold this month" value={money(s?.soldThisMonth)} note="Cancelled sales left out" />
                    <KpiTile label="Still to be paid" value={money(s?.outstanding)} note="Across all customers" />
                </div>
            )}

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search sales" placeholder="Search sale number, customer or product" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by payment"
                    allLabel="Any payment"
                    value={params.filters.payment ?? ''}
                    options={[
                        { value: 'paid', label: 'Paid' },
                        { value: 'partial', label: 'Partially paid' },
                        { value: 'unpaid', label: 'Unpaid' },
                    ]}
                    onChange={(v) => list.setFilter('payment', v)}
                />
                <FilterSelect
                    label="Filter by status"
                    allLabel="All sales"
                    value={params.filters.status ?? ''}
                    options={[
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    onChange={(v) => list.setFilter('status', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Sales"
                noun="sales"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(sale) => sale.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: Receipt,
                    title: 'No sales yet',
                    description: 'Record each sale as it happens. The pieces come out of stock and anything unpaid is added to what the customer owes.',
                    action: <Button onClick={() => setDialog({ kind: 'new' })}>New sale</Button>,
                }}
                mobileCard={(sale) => (
                    <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                            <SaleName sale={sale} />
                            <TotalCell sale={sale} />
                        </div>
                        <CustomerCell sale={sale} />
                        <ItemsCell sale={sale} />
                        <PaymentCell sale={sale} />
                        <SaleActions sale={sale} onView={onView} onPay={onPay} />
                    </div>
                )}
            />

            {dialog?.kind === 'new' && <NewSaleModal onClose={closeDialog} />}
            {dialog?.kind === 'pay' && <RecordPaymentModal sale={dialog.sale} onClose={closeDialog} />}
            {dialog?.kind === 'view' && (
                <SaleDetailsModal sale={dialog.sale} canCancel={canCancel} onPay={onPay} onCancelSale={(sale) => setDialog({ kind: 'cancel', sale })} onClose={closeDialog} />
            )}

            <ConfirmDialog
                open={cancelTarget !== null}
                tone="danger"
                title="Cancel this sale?"
                confirmLabel="Cancel sale"
                loading={cancel.isPending}
                onCancel={closeDialog}
                onConfirm={() => cancelTarget && confirmCancel(cancelTarget)}
            >
                {cancelTarget && (
                    <p>
                        {cancelTarget.code} will be cancelled, its items put back in stock
                        {cancelTarget.balance > 0 ? ` and the ${formatNaira(cancelTarget.balance)} still owed taken off ${cancelTarget.customerName}` : ''}.
                        {cancelTarget.amountPaid > 0 ? ` The ${formatNaira(cancelTarget.amountPaid)} already received has to be given back by hand.` : ''} This cannot be undone.
                    </p>
                )}
            </ConfirmDialog>
        </>
    )
}