import { Outlet, useLocation } from 'react-router-dom'
import { canAccessPath } from '@/config/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ForbiddenPage } from '../../pages/ForbiddenPage'

/**
 * Shows the 403 page instead of a screen the user's role may not open.
 * The address stays as typed, so it is clear why nothing loaded.
 * The rules come from the navigation config, so a page and its menu item can never disagree.
 */
export function RequireAccess() {
    const { role } = useCurrentUser()
    const { pathname } = useLocation()
    return canAccessPath(role, pathname) ? <Outlet /> : <ForbiddenPage />
}