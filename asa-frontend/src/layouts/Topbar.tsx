import { Bell, ChevronDown, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui'
import { findNavItem } from '@/config/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'
import { ROLE_LABELS, type User } from '@/types/user'

interface TopbarProps {
    user: User
    collapsed: boolean
    mobileOpen: boolean
    onToggleCollapsed: () => void
    onToggleMobile: () => void
}

function IconButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn('grid size-10 place-items-center rounded-md text-ink-600 hover:bg-ink-100', className)}
            {...props}
        />
    )
}

function UserMenu({ user }: { user: User }) {
    const { logout } = useAuth()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onPointerDown = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="flex h-10 items-center gap-2.5 rounded-md pr-2 pl-1 hover:bg-ink-100"
            >
                <span className="grid size-8 place-items-center rounded-full bg-ink-900 text-sm font-semibold text-brand-400">
                    {user.name.charAt(0)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-medium">{user.name}</span>
                    <span className="block text-xs text-text-muted">{ROLE_LABELS[user.role]}</span>
                </span>
                <ChevronDown className="hidden size-4 text-ink-500 sm:block" aria-hidden />
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface p-1.5 shadow-pop"
                >
                    <div className="border-b border-border px-3 py-2 sm:hidden">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-text-muted">{ROLE_LABELS[user.role]}</p>
                    </div>
                    <Link
                        role="menuitem"
                        to="/account/password"
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-ink-50"
                        >
                        <KeyRound className="size-4" aria-hidden /> Change password
                    </Link>
                    <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                            setOpen(false)
                            void logout()
                        }}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-ink-50"
                    >
                        <LogOut className="size-4" aria-hidden /> Sign out
                    </button>
                    <button role="menuitem" type="button" className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-ink-50">
                        <UserRound className="size-4" aria-hidden /> My profile
                    </button>
                    {/* <button role="menuitem" type="button" className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-ink-50">
                        <LogOut className="size-4" aria-hidden /> Sign out
                    </button> */}
                </div>
            )}
        </div>
    )
}

export function Topbar({ user, collapsed, mobileOpen, onToggleCollapsed, onToggleMobile }: TopbarProps) {
    const { pathname } = useLocation()
    const current = findNavItem(pathname)

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface px-4 sm:px-6">
            <IconButton className="lg:hidden" onClick={onToggleMobile} aria-label="Open menu" aria-expanded={mobileOpen} aria-controls="app-sidebar">
                <Menu className="size-5" aria-hidden />
            </IconButton>
            <IconButton
                className="hidden lg:grid"
                onClick={onToggleCollapsed}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <PanelLeftOpen className="size-5" aria-hidden /> : <PanelLeftClose className="size-5" aria-hidden />}
            </IconButton>

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1 sm:flex-none">
                <p className="truncate text-sm text-text-muted">
                    {current?.group.label && <span className="hidden sm:inline">{current.group.label} / </span>}
                    <span className="font-semibold text-ink-900">{current?.item.label ?? (pathname.startsWith('/account') ? 'Account' : 'ASA LTD')}</span>
                </p>
            </nav>

            <div className="relative ml-4 hidden max-w-md flex-1 md:block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
                <input
                    type="search"
                    placeholder="Search customers, products, invoices"
                    aria-label="Search"
                    className="h-10 w-full rounded-md border border-border bg-ink-50 pr-3 pl-9 text-sm placeholder:text-ink-400 hover:border-ink-300"
                />
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <IconButton className="md:hidden" aria-label="Search">
                    <Search className="size-5" aria-hidden />
                </IconButton>
                <Link to="/sales" className="hidden sm:block">
                    <Button size="md">
                        <Plus className="size-4" aria-hidden />
                        New sale
                    </Button>
                </Link>
                <IconButton aria-label="Notifications" className="relative">
                    <Bell className="size-5" aria-hidden />
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-danger-600 ring-2 ring-surface" aria-hidden />
                </IconButton>
                <UserMenu user={user} />
            </div>
        </header>
    )
}