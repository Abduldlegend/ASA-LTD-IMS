import { useMemo } from 'react'
import { listColumns } from '@/components/data-table'
import { formatDateTime } from '@/lib/format'
import type { ManagedUser } from './types'
import { ActiveBadge, RoleBadge, UserActions, type UserActionHandlers } from './UserParts'

const col = listColumns<ManagedUser>()

export const lastSignIn = (user: ManagedUser) => (user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never')

export function useUserColumns(handlers: UserActionHandlers) {
    const { currentUserId, onEdit, onToggleActive } = handlers
    return useMemo(
        () =>
            col.columns([
                col.accessor('name', {
                    header: 'Name',
                    cell: ({ row }) => (
                        <div>
                            <p className="font-medium">
                                {row.original.name}
                                {row.original.id === currentUserId && <span className="ml-2 text-xs font-normal text-text-muted">(you)</span>}
                            </p>
                            <p className="text-xs text-text-muted">{row.original.email}</p>
                        </div>
                    ),
                }),
                col.accessor('role', { header: 'Role', cell: ({ row }) => <RoleBadge user={row.original} /> }),
                col.accessor('phone', { header: 'Phone', enableSorting: false, cell: ({ getValue }) => <span className="num">{getValue() || '—'}</span> }),
                col.accessor('lastLoginAt', { header: 'Last sign-in', cell: ({ row }) => lastSignIn(row.original) }),
                col.display({ id: 'status', header: 'Status', cell: ({ row }) => <ActiveBadge user={row.original} /> }),
                col.display({
                    id: 'actions',
                    header: () => <span className="sr-only">Actions</span>,
                    meta: { className: 'w-px whitespace-nowrap' },
                    cell: ({ row }) => <UserActions user={row.original} currentUserId={currentUserId} onEdit={onEdit} onToggleActive={onToggleActive} />,
                }),
            ]),
        [currentUserId, onEdit, onToggleActive],
    )
}