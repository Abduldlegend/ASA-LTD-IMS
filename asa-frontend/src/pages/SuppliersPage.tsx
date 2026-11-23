import { Boxes, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { ActiveBadge, Button, ConfirmDialog, PageHeader } from '../components/ui'
import { canManageProcurement, canViewFinancials } from '@/config/permissions'
import { useSupplierColumns } from '@/features/suppliers/supplierColumns'
import { SupplierFormModal } from '@/features/suppliers/SupplierFormModal'
import { ContactCell, OwedCell, SupplierActions } from '@/features/suppliers/SupplierParts'
import type { Supplier } from '@/features/suppliers/types'
import { useSetSupplierActive, useSupplierList } from '@/features/suppliers/useSuppliers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { toApiError } from '@/lib/apiError'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['name', 'code', 'amountOwed'],
    filters: { status: ['active', 'inactive'] },
    defaultSort: { id: 'name', desc: false },
}

type Dialog = { kind: 'create' } | { kind: 'edit'; supplier: Supplier } | { kind: 'status'; supplier: Supplier } | null

export function SuppliersPage() {
    const { role } = useCurrentUser()
    const canManage = canManageProcurement(role)
    const canSeeMoney = canViewFinancials(role)
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useSupplierList(params)
    const setActive = useSetSupplierActive()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onEdit = useCallback((supplier: Supplier) => setDialog({ kind: 'edit', supplier }), [])
    const onToggleActive = useCallback((supplier: Supplier) => setDialog({ kind: 'status', supplier }), [])
    const columns = useSupplierColumns({ onEdit, onToggleActive }, canManage, canSeeMoney)
    const closeDialog = () => setDialog(null)

    const confirmStatus = async (supplier: Supplier) => {
        try {
            await setActive.mutateAsync({ id: supplier.id, active: !supplier.active })
            toast.success(supplier.active ? `${supplier.name} was deactivated` : `${supplier.name} was reactivated`)
        } catch (e) {
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    const statusTarget = dialog?.kind === 'status' ? dialog.supplier : null

    return (
        <>
            <PageHeader
                title="Suppliers"
                description="Who you buy cement, sand, granite and other materials from"
                actions={
                    canManage && (
                        <Button onClick={() => setDialog({ kind: 'create' })}>
                            <Plus className="size-4" aria-hidden /> Add supplier
                        </Button>
                    )
                }
            />

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search suppliers" placeholder="Search name, contact, phone or address" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by status"
                    allLabel="All statuses"
                    value={params.filters.status ?? ''}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                    ]}
                    onChange={(v) => list.setFilter('status', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Suppliers"
                noun="suppliers"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(supplier) => supplier.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: Boxes,
                    title: 'No suppliers yet',
                    description: canManage ? 'Add the people and companies you buy materials from.' : 'A manager has not added any suppliers yet.',
                    action: canManage ? <Button onClick={() => setDialog({ kind: 'create' })}>Add supplier</Button> : undefined,
                }}
                mobileCard={(supplier) => (
                    <div className="space-y-2.5">
                        <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="num text-xs text-text-muted">{supplier.code}</p>
                        </div>
                        <ContactCell supplier={supplier} />
                        {supplier.address && <p className="text-sm text-ink-700">{supplier.address}</p>}
                        {canSeeMoney && (
                            <p className="text-sm">
                                <span className="text-xs text-text-muted">We owe: </span>
                                <OwedCell supplier={supplier} />
                            </p>
                        )}
                        <ActiveBadge active={supplier.active} />
                        {canManage && <SupplierActions supplier={supplier} onEdit={onEdit} onToggleActive={onToggleActive} />}
                    </div>
                )}
            />

            {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
                <SupplierFormModal supplier={dialog.kind === 'edit' ? dialog.supplier : undefined} onClose={closeDialog} />
            )}

            <ConfirmDialog
                open={statusTarget !== null}
                tone={statusTarget?.active ? 'danger' : 'primary'}
                title={statusTarget?.active ? 'Deactivate this supplier?' : 'Reactivate this supplier?'}
                confirmLabel={statusTarget?.active ? 'Deactivate' : 'Reactivate'}
                loading={setActive.isPending}
                onCancel={closeDialog}
                onConfirm={() => statusTarget && confirmStatus(statusTarget)}
            >
                {statusTarget &&
                    (statusTarget.active ? (
                        <p>{statusTarget.name} will no longer be offered when you record a purchase. Past purchases and any amount owed stay as they are, and you can reactivate them later.</p>
                    ) : (
                        <p>{statusTarget.name} will be offered for purchases again.</p>
                    ))}
            </ConfirmDialog>
        </>
    )
}