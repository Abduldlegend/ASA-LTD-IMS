import type { ReactNode } from 'react'
import { Button } from '@/components/ui'

interface ListToolbarProps {
    /** The search box and filters. */
    children: ReactNode
    /** True when a search or filter is on. Shows the "Clear" button. */
    active: boolean
    onClear: () => void
}

export function ListToolbar({ children, active, onClear }: ListToolbarProps) {
    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {children}
            {active && (
                <Button variant="ghost" size="sm" onClick={onClear}>
                    Clear
                </Button>
            )}
        </div>
    )
}