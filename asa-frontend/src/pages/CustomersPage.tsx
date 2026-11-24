import { Plus, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { ActiveBadge, Button, ConfirmDialog, PageHeader } from '@/components/ui'
import { canDeactivateCustomers, canViewFinancials } from '@/config/permissions'
import { useCustomerColumns } from '@/features/customers/customerColumns'
import { CustomerFormModal } from '@/features/customers/CustomerFormModal'
import { ContactCell, CustomerActions, CustomerName, OwesCell } from '@/features/customers/CustomerParts'
import type { Customer } from '@/features/customers/types'
import { useCustomerList, useSetCustomerActive } from '@/features/customers/useCustomers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { toApiError } from '@/lib/apiError'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['name', 'code', 'balanceOwed', 'createdAt'],
    filters: { type: ['individual', 'business'], status: ['active', 'inactive'], balance: ['owing'] },
    defaultSort: { id: 'name', desc: false },
}

type Dialog = { kind: 'create' } | { kind: 'edit'; customer: Customer } | { kind: 'status'; customer: Customer } | null

export function CustomersPage() {
    const { role } = useCurrentUser()
    const canDeactivate = canDeactivateCustomers(role)
    const canSeeMoney = canViewFinancials(role)
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useCustomerList(params)
    const setActive = useSetCustomerActive()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onEdit = useCallback((customer: Customer) => setDialog({ kind: 'edit', customer }), [])
    const onToggleActive = useCallback((customer: Customer) => setDialog({ kind: 'status', customer }), [])
    const columns = useCustomerColumns({ onEdit, onToggleActive }, canDeactivate, canSeeMoney)
    const closeDialog = () => setDialog(null)

    const confirmStatus = async (customer: Customer) => {
        try {
            await setActive.mutateAsync({ id: customer.id, active: !customer.active })
            toast.success(customer.active ? `${customer.name} was deactivated` : `${customer.name} was reactivated`)
        } catch (e) {
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    const statusTarget = dialog?.kind === 'status' ? dialog.customer : null

    return (
        <>
            <PageHeader
                title="Customers"
                description="Who buys blocks, interlocks and cement from you"
                actions={
                    <Button onClick={() => setDialog({ kind: 'create' })}>
                        <Plus className="size-4" aria-hidden /> Add customer
                    </Button>
                }
            />

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search customers" placeholder="Search name, phone, contact or address" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by type"
                    allLabel="All types"
                    value={params.filters.type ?? ''}
                    options={[
                        { value: 'individual', label: 'Individuals' },
                        { value: 'business', label: 'Businesses' },
                    ]}
                    onChange={(v) => list.setFilter('type', v)}
                />
                {canSeeMoney && (
                    <FilterSelect
                        label="Filter by balance"
                        allLabel="Any balance"
                        value={params.filters.balance ?? ''}
                        options={[{ value: 'owing', label: 'Owing money' }]}
                        onChange={(v) => list.setFilter('balance', v)}
                    />
                )}
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
                caption="Customers"
                noun="customers"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(customer) => customer.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: Users,
                    title: 'No customers yet',
                    description: 'Add the people and businesses you sell to, so a sale can be recorded against them.',
                    action: <Button onClick={() => setDialog({ kind: 'create' })}>Add customer</Button>,
                }}
                mobileCard={(customer) => (
                    <div className="space-y-2.5">
                        <CustomerName customer={customer} />
                        <ContactCell customer={customer} />
                        {customer.address && <p className="text-sm text-ink-700">{customer.address}</p>}
                        {canSeeMoney && customer.balanceOwed !== null && customer.balanceOwed > 0 && (
                            <p className="text-sm">
                                <span className="text-xs text-text-muted">Owes: </span>
                                <OwesCell customer={customer} />
                            </p>
                        )}
                        <ActiveBadge active={customer.active} />
                        <CustomerActions customer={customer} canDeactivate={canDeactivate} onEdit={onEdit} onToggleActive={onToggleActive} />
                    </div>
                )}
            />

            {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
                <CustomerFormModal customer={dialog.kind === 'edit' ? dialog.customer : undefined} onClose={closeDialog} />
            )}

            <ConfirmDialog
                open={statusTarget !== null}
                tone={statusTarget?.active ? 'danger' : 'primary'}
                title={statusTarget?.active ? 'Deactivate this customer?' : 'Reactivate this customer?'}
                confirmLabel={statusTarget?.active ? 'Deactivate' : 'Reactivate'}
                loading={setActive.isPending}
                onCancel={closeDialog}
                onConfirm={() => statusTarget && confirmStatus(statusTarget)}
            >
                {statusTarget &&
                    (statusTarget.active ? (
                        <p>{statusTarget.name} will no longer be offered when you record a sale. Past sales and any balance owed stay as they are, and you can reactivate them later.</p>
                    ) : (
                        <p>{statusTarget.name} will be offered for sales again.</p>
                    ))}
            </ConfirmDialog>
        </>
    )
}