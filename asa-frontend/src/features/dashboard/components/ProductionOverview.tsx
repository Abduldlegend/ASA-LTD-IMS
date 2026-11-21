import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, StatusBadge, type StatusGroup } from '@/components/ui'
import { formatQuantity } from '@/lib/format'
import type { DashboardData } from '@/types/dashboard'
import { CHART } from './chartColors'

interface ProductionOverviewProps {
    production: DashboardData['production']
    periodLabel: string
}

function Stat({ status, value, note }: { status: string; value: number; note: string }) {
    return (
        <div>
            <StatusBadge group={'production' satisfies StatusGroup} status={status} />
            <p className="num mt-2 text-xl font-bold">{formatQuantity(value)}</p>
            <p className="text-xs text-text-muted">{note}</p>
        </div>
    )
}

export function ProductionOverview({ production, periodLabel }: ProductionOverviewProps) {
    // The chart stacks accepted and rejected pieces, so the bars add up to what was produced.
    const data = production.series.map((p) => ({
        label: p.label,
        accepted: p.produced - p.rejected,
        rejected: p.rejected,
    }))

    return (
        <Card className="h-full">
            <CardHeader title="Production overview" description={`Pieces produced, ${periodLabel.toLowerCase()}`} />
            <div className="grid grid-cols-2 gap-5 border-b border-border p-5 sm:grid-cols-4">
                <Stat status="produced" value={production.producedInRange} note="pieces in this period" />
                <Stat status="curing" value={production.curingNow} note="pieces right now" />
                <Stat status="ready" value={production.readyNow} note="pieces right now" />
                <Stat status="rejected" value={production.rejectedInRange} note="pieces in this period" />
            </div>
            <div className="p-5">
                <ul className="mb-3 flex gap-5 text-sm text-ink-700">
                    <li className="flex items-center gap-2">
                        <span className="size-3 rounded-sm bg-ink-900" aria-hidden />
                        Accepted
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="size-3 rounded-sm bg-danger-600" aria-hidden />
                        Rejected or damaged
                    </li>
                </ul>
                <div
                    role="img"
                    aria-label={`Bar chart of daily production. ${formatQuantity(production.producedInRange)} pieces produced in total.`}
                    className="h-52 min-w-0"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <CartesianGrid stroke={CHART.ink100} vertical={false} />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b6b6b', fontSize: 12 }} minTickGap={16} tickMargin={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b6b', fontSize: 12 }} width={44} />
                            <Tooltip
                                cursor={{ fill: CHART.ink100 }}
                                contentStyle={{ borderRadius: 6, border: `1px solid ${CHART.ink200}` }}
                                formatter={(value) => formatQuantity(Number(value ?? 0), 'pcs')}
                            />
                            <Bar dataKey="accepted" name="Accepted" stackId="p" fill={CHART.ink900} isAnimationActive={false} />
                            <Bar dataKey="rejected" name="Rejected or damaged" stackId="p" fill={CHART.danger} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    )
}