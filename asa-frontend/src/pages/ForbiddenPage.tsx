import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ROLE_LABELS } from '@/types/user'

export function ForbiddenPage() {
    const { role } = useCurrentUser()
    return (
        <div className="mx-auto max-w-md py-24 text-center">
            <p className="text-sm font-medium text-text-muted">Error 403</p>
            <h1 className="mt-2 text-3xl">You don't have access to this page</h1>
            <p className="mt-2 text-text-muted">
                Your account is set up as {ROLE_LABELS[role]}, and this page is for someone with a different role. If you need it, ask a manager to change your access.
            </p>
            <Link to="/dashboard" className="mt-6 inline-block">
                <Button>Go to dashboard</Button>
            </Link>
        </div>
    )
}