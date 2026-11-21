import { Card, CardHeader } from '@/components/ui'
import { formatNaira } from '@/lib/format'

interface SalesByCategoryProps {
    data: { category: string; amount: number }[]
}

export function SalesByCategory({ data }: SalesByCategoryProps) {
    const total = data.reduce((s, d) => s + d.amount, 0)
    const sorted = [...data].sort((a, b) => b.amount - a.amount)

    return (
        <Card className="h-full">
            <CardHeader title="Sales by category" description="Share of sales in this period" />
            <ul className="space-y-5 p-5">
                {sorted.map((row) => {
                    const percent = total > 0 ? (row.amount / total) * 100 : 0
                    return (
                        <li key={row.category}>
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                                <span className="font-medium">{row.category}</span>
                                <span className="num text-text-muted">
                                    {formatNaira(row.amount)} · {percent.toFixed(0)}%
                                </span>
                            </div>
                            <div
                                className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100"
                                role="img"
                                aria-label={`${row.category}: ${percent.toFixed(0)} percent of sales`}
                            >
                                <div className="h-full rounded-full bg-ink-900" style={{ width: `${percent}%` }} />
                            </div>
                        </li>
                    )
                })}
            </ul>
        </Card>
    )
}