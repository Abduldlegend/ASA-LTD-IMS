import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface SectionTab {
    to: string
    label: string
    /** Match the address exactly, so "/inventory" is not also highlighted on "/inventory/movements". */
    end?: boolean
}

/** Switches between the screens of one section, as links, so each has its own address. */
export function SectionTabs({ label, tabs }: { label: string; tabs: SectionTab[] }) {
    const tabClass = ({ isActive }: { isActive: boolean }) =>
        cn(
            '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            isActive ? 'border-ink-900 text-ink-900' : 'border-transparent text-text-muted hover:text-ink-900',
        )
    return (
        <nav aria-label={label} className="mb-5 flex gap-1 border-b border-border">
            {tabs.map((tab) => (
                <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
                    {tab.label}
                </NavLink>
            ))}
        </nav>
    )
}