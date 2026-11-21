import { Receipt } from 'lucide-react'
import { Card, CardHeader, EmptyState, StatusBadge } from '@/components/ui'
import { formatDateTime, formatNaira } from '@/lib/format'
import type { RecentTransaction, TransactionType } from '@/types/dashboard'

const TYPE_LABELS: Record<TransactionType, string> = {
    sale: 'Sale',
    expense: 'Expense',
    purchase: 'Purchase',
    payment: 'Payment received',
}

/** Money coming in is shown with a plus sign and money going out with a minus sign. */
const MONEY_IN: TransactionType[] = ['sale', 'payment']

export function RecentTransactions({ items }: { items: RecentTransaction[] }) {
    return (
        <Card>
            <CardHeader title="Recent transactions" description="Latest sales, payments, purchases and expenses" />
            {items.length === 0 ? (
                <EmptyState icon={Receipt} title="No transactions yet" description="Sales, purchases and expenses will appear here as they are recorded." />
            ) : (
                <ul className="divide-y divide-border">
                    {items.map((t) => (
                        <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5">
                            <div className="min-w-0 flex-1 basis-56">
                                <p className="truncate text-sm font-medium">{t.party}</p>
                                <p className="num text-xs text-text-muted">
                                    {TYPE_LABELS[t.type]} · {t.reference} · {formatDateTime(t.occurredAt)}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <StatusBadge group={t.statusGroup} status={t.status} />
                                <p className="num w-32 text-right text-sm font-semibold">
                                    {MONEY_IN.includes(t.type) ? '+' : '−'}
                                    {formatNaira(t.amount)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}