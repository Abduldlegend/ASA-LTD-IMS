import { Plus, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { Button, ConfirmDialog, PageHeader } from '@/components/ui'
import { UserFormModal } from '@/features/users/UserFormModal'
import { lastSignIn, useUserColumns } from '@/features/users/usersColumns'
import { ActiveBadge, RoleBadge, UserActions } from '@/features/users/UserParts'
import { useSetUserActive, useUsersList } from '@/features/users/useUsers'
import type { ManagedUser } from '@/features/users/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { toApiError } from '@/lib/apiError'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

// A constant, so the list state is not rebuilt on every render.
const SCHEMA: ListSchema = {
    sortable: ['name', 'role', 'lastLoginAt'],
    filters: { role: ['admin', 'staff'], status: ['active', 'inactive'] },
    defaultSort: { id: 'name', desc: false },
}

type Dialog = { kind: 'create' } | { kind: 'edit'; user: ManagedUser } | { kind: 'status'; user: ManagedUser } | null

export function UsersPage() {
    const me = useCurrentUser()
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useUsersList(params)
    const setActive = useSetUserActive()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onEdit = useCallback((user: ManagedUser) => setDialog({ kind: 'edit', user }), [])
    const onToggleActive = useCallback((user: ManagedUser) => setDialog({ kind: 'status', user }), [])
    const columns = useUserColumns({ currentUserId: me.id, onEdit, onToggleActive })

    const closeDialog = () => setDialog(null)
    const confirmStatus = async (user: ManagedUser) => {
        try {
            await setActive.mutateAsync({ id: user.id, active: !user.active })
            toast.success(user.active ? `${user.name} was deactivated` : `${user.name} was reactivated`)
        } catch (e) {
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    return (
        <>
            <PageHeader
                title="User management"
                description="Who can sign in, and what they can see"
                actions={
                    <Button onClick={() => setDialog({ kind: 'create' })}>
                        <Plus className="size-4" aria-hidden /> Add user
                    </Button>
                }
            />

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search users" placeholder="Search name, email or phone" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by role"
                    allLabel="All roles"
                    value={params.filters.role ?? ''}
                    options={[
                        { value: 'admin', label: 'Management' },
                        { value: 'staff', label: 'Staff' },
                    ]}
                    onChange={(v) => list.setFilter('role', v)}
                />
                <FilterSelect
                    label="Filter by status"
                    allLabel="All statuses"
                    value={params.filters.status ?? ''}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Deactivated' },
                    ]}
                    onChange={(v) => list.setFilter('status', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Users"
                noun="users"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(user) => user.id}
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
                    title: 'No users yet',
                    description: 'Add the people who will use the system.',
                    action: <Button onClick={() => setDialog({ kind: 'create' })}>Add user</Button>,
                }}
                mobileCard={(user) => (
                    <div className="space-y-2.5">
                        <div>
                            <p className="font-medium">
                                {user.name}
                                {user.id === me.id && <span className="ml-2 text-xs font-normal text-text-muted">(you)</span>}
                            </p>
                            <p className="text-sm text-text-muted">{user.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <RoleBadge user={user} />
                            <ActiveBadge user={user} />
                        </div>
                        <p className="text-xs text-text-muted">Last sign-in: {lastSignIn(user)}</p>
                        <UserActions user={user} currentUserId={me.id} onEdit={onEdit} onToggleActive={onToggleActive} />
                    </div>
                )}
            />

            {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
                <UserFormModal
                    user={dialog.kind === 'edit' ? dialog.user : undefined}
                    isSelf={dialog.kind === 'edit' && dialog.user.id === me.id}
                    onClose={closeDialog}
                />
            )}

            <ConfirmDialog
                open={dialog?.kind === 'status'}
                tone={dialog?.kind === 'status' && dialog.user.active ? 'danger' : 'primary'}
                title={dialog?.kind === 'status' && dialog.user.active ? 'Deactivate this account?' : 'Reactivate this account?'}
                confirmLabel={dialog?.kind === 'status' && dialog.user.active ? 'Deactivate' : 'Reactivate'}
                loading={setActive.isPending}
                onCancel={closeDialog}
                onConfirm={() => dialog?.kind === 'status' && confirmStatus(dialog.user)}
            >
                {dialog?.kind === 'status' &&
                    (dialog.user.active ? (
                        <p>
                            {dialog.user.name} will no longer be able to sign in. Their records and history stay as they are, and you can reactivate the account later.
                        </p>
                    ) : (
                        <p>{dialog.user.name} will be able to sign in again.</p>
                    ))}
            </ConfirmDialog>
        </>
    )
}