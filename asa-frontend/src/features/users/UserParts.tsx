import { Badge, Button } from '@/components/ui'
import { ROLE_LABELS } from '@/types/user'
import type { ManagedUser } from './types'

export function RoleBadge({ user }: { user: ManagedUser }) {
    return <Badge tone={user.role === 'admin' ? 'brand' : 'neutral'}>{ROLE_LABELS[user.role]}</Badge>
}

export function ActiveBadge({ user }: { user: ManagedUser }) {
    return <Badge tone={user.active ? 'success' : 'neutral'}>{user.active ? 'Active' : 'Deactivated'}</Badge>
}

export interface UserActionHandlers {
    currentUserId: string
    onEdit: (user: ManagedUser) => void
    onToggleActive: (user: ManagedUser) => void
}

/** The buttons at the end of a row, used in the table and in the phone card. */
export function UserActions({ user, currentUserId, onEdit, onToggleActive }: UserActionHandlers & { user: ManagedUser }) {
    return (
        <div className="flex justify-end gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(user)} aria-label={`Edit ${user.name}`}>
                Edit
            </Button>
            {/* Nobody can deactivate themselves, or they would lock themselves out. */}
            {user.id !== currentUserId && (
                <Button variant="ghost" size="sm" onClick={() => onToggleActive(user)} aria-label={`${user.active ? 'Deactivate' : 'Reactivate'} ${user.name}`}>
                    {user.active ? 'Deactivate' : 'Reactivate'}
                </Button>
            )}
        </div>
    )
}