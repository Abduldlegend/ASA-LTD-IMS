import { PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, EmptyState, StatusBadge } from '@/components/ui'
import { formatQuantity } from '@/lib/format'
import type { LowStockItem } from '@/types/dashboard'

export function LowStockList({ items }: { items: LowStockItem[] }) {
    return (
        <Card className="h-full">
            <CardHeader
                title="Low stock"
                description="Below the minimum level"
                action={
                    <Link to="/inventory" className="text-sm font-medium text-ink-900 underline underline-offset-4 hover:text-ink-600">
                        View inventory
                    </Link>
                }
            />
            {items.length === 0 ? (
                <EmptyState icon={PackageCheck} title="Stock levels look healthy" description="Nothing is below its minimum level right now." />
            ) : (
                <ul className="divide-y divide-border">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{item.name}</p>
                                <p className="num text-xs text-text-muted">
                                    {formatQuantity(item.current, item.unit)} left · minimum {formatQuantity(item.minimum, item.unit)}
                                </p>
                            </div>
                            <StatusBadge group="stock" status={item.current === 0 ? 'out' : 'low'} />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}