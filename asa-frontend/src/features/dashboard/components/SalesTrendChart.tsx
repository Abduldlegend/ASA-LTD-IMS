import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNaira, formatNairaCompact } from '@/lib/format'
import type { TrendPoint } from '@/types/dashboard'
import { CHART } from './chartColors'

interface SalesTrendChartProps {
    data: TrendPoint[]
    periodLabel: string
}

/** Sits on a dark card so the yellow line has the contrast it needs. */
export function SalesTrendChart({ data, periodLabel }: SalesTrendChartProps) {
    const sales = data.reduce((s, p) => s + p.sales, 0)
    const expenses = data.reduce((s, p) => s + p.expenses, 0)

    return (
        <section className="min-w-0 rounded-lg bg-ink-900 p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg">Sales and expenses</h2>
                    <p className="mt-0.5 text-sm text-ink-300">{periodLabel}</p>
                </div>
                <ul className="flex gap-5 text-sm text-ink-200">
                    <li className="flex items-center gap-2">
                        <span className="h-0.5 w-5 rounded bg-brand-400" aria-hidden />
                        Sales
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-5 border-t-2 border-dashed border-ink-300" aria-hidden />
                        Expenses
                    </li>
                </ul>
            </div>
            <div
                role="img"
                aria-label={`Line chart of sales and expenses. Total sales ${formatNaira(sales)}, total expenses ${formatNaira(expenses)}.`}
                className="mt-4 h-64 min-w-0"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke={CHART.ink700} vertical={false} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: CHART.ink400, fontSize: 12 }}
                            minTickGap={24}
                            tickMargin={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: CHART.ink400, fontSize: 12 }}
                            tickFormatter={(v: number) => formatNairaCompact(v)}
                            width={64}
                        />
                        <Tooltip
                            cursor={{ stroke: CHART.ink600 }}
                            contentStyle={{ background: '#262626', border: `1px solid ${CHART.ink700}`, borderRadius: 6, color: '#fff' }}
                            labelStyle={{ color: CHART.ink300 }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => formatNaira(Number(value ?? 0))}
                        />
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            name="Expenses"
                            stroke={CHART.ink300}
                            strokeWidth={2}
                            strokeDasharray="5 4"
                            fill="none"
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            name="Sales"
                            stroke={CHART.brand}
                            strokeWidth={2.5}
                            fill={CHART.brand}
                            fillOpacity={0.12}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    )
}