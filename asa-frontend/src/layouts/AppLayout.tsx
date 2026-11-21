import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/guards/ErrorBoundary'
import { RequireAccess } from '@/components/guards/RequireAccess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
    const user = useCurrentUser()
    const { pathname } = useLocation()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    // The drawer closes when a nav link is clicked (see Sidebar) and on Escape.
    useEffect(() => {
        if (!mobileOpen) return
        const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [mobileOpen])

    return (
        <div className="flex min-h-screen">
            <Sidebar role={user.role} collapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
            {mobileOpen && (
                <div className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar
                    user={user}
                    collapsed={collapsed}
                    mobileOpen={mobileOpen}
                    onToggleCollapsed={() => setCollapsed((c) => !c)}
                    onToggleMobile={() => setMobileOpen((o) => !o)}
                />
                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <ErrorBoundary resetKey={pathname}>
                        <RequireAccess />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    )
}