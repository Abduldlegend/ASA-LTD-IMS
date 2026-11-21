import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoader } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'

/** Everything inside needs a signed-in user. Everyone else is sent to the login page. */
export function ProtectedRoute() {
    const { status, sessionEnd } = useAuth()
    const location = useLocation()

    if (status === 'loading') return <FullPageLoader label="Checking your session" />

    if (status === 'unauthenticated') {
        // After the user signs out on purpose there is nothing to go back to. In every other case
        // (a link opened while signed out, or a session that expired) they return to where they were.
        const from = sessionEnd === 'signed-out' ? undefined : `${location.pathname}${location.search}${location.hash}`
        return <Navigate to="/login" replace state={from ? { from } : undefined} />
    }

    return <Outlet />
}