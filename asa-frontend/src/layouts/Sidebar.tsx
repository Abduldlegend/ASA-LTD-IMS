import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { navForRole } from '@/config/navigation'
import { cn } from '@/lib/cn'
import type { Role } from '@/types/user'

interface SidebarProps {
    role: Role
    /** Icon-only mode, desktop only. */
    collapsed: boolean
    /** Drawer state, mobile only. */
    mobileOpen: boolean
    onNavigate: () => void
}

export function Sidebar({ role, collapsed, mobileOpen, onNavigate }: SidebarProps) {
    const groups = navForRole(role)
    const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (id: string) => setClosedGroups((prev) => ({ ...prev, [id]: !prev[id] }))

    return (
        <aside
            id="app-sidebar"
            className={cn(
                'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 text-ink-200 transition-transform duration-200',
                'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-none',
                mobileOpen ? 'translate-x-0' : '-translate-x-full',
                collapsed && 'lg:w-[72px]',
            )}
            aria-label="Main navigation"
        >
            <div className={cn('flex h-16 shrink-0 items-center gap-3 border-b border-ink-700 px-5', collapsed && 'lg:justify-center lg:px-0')}>
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-400 text-lg font-extrabold text-ink-900">
                    A
                </span>
                <div className={cn('leading-tight', collapsed && 'lg:hidden')}>
                    <p className="font-bold tracking-tight text-white">ASA LTD</p>
                    <p className="text-xs text-ink-400">Blocks and interlocks</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {groups.map((group) => {
                    const open = !closedGroups[group.id]
                    return (
                        <div key={group.id} className="mb-3">
                            {group.label && (
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.id)}
                                    aria-expanded={open}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium text-ink-400 hover:text-white',
                                        collapsed && 'lg:hidden',
                                    )}
                                >
                                    {group.label}
                                    <ChevronDown className={cn('size-3.5 transition-transform', !open && '-rotate-90')} aria-hidden />
                                </button>
                            )}
                            {group.label && collapsed && <div className="mx-3 my-2 hidden border-t border-ink-700 lg:block" />}
                            <ul className={cn('mt-1 space-y-0.5', !open && 'hidden', collapsed && 'lg:block')}>
                                {group.items.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={onNavigate}
                                            title={collapsed ? item.label : undefined}
                                            className={({ isActive }) =>
                                                cn(
                                                    'relative flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                                                    collapsed && 'lg:justify-center lg:px-0',
                                                    isActive
                                                        ? 'bg-ink-800 font-medium text-white'
                                                        : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                                                )
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {isActive && (
                                                        <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r bg-brand-400" aria-hidden />
                                                    )}
                                                    <item.icon className={cn('size-[18px] shrink-0', isActive && 'text-brand-400')} aria-hidden />
                                                    <span className={cn(collapsed && 'lg:sr-only')}>{item.label}</span>
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </nav>
        </aside>
    )
}