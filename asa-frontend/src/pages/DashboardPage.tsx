import { subDays } from 'date-fns'
import { RotateCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, EmptyState, KpiTile, PageHeader } from '@/components/ui'
import { canViewFinancials } from '@/config/permissions'
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton'
import { DateRangeFilter } from '@/features/dashboard/components/DateRangeFilter'
import { LowStockList } from '@/features/dashboard/components/LowStockList'
import { ProductionOverview } from '@/features/dashboard/components/ProductionOverview'
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions'
import { SalesByCategory } from '@/features/dashboard/components/SalesByCategory'
import { SalesTrendChart } from '@/features/dashboard/components/SalesTrendChart'
import { describeRange, rangeForPreset, toIsoDate, type RangePreset } from '@/features/dashboard/dateRange'
import { useDashboard } from '@/features/dashboard/useDashboard'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatNaira, formatQuantity } from '@/lib/format'
import { piecesToSquareMetres } from '@/lib/interlock'
import type { DashboardRange } from '@/types/dashboard'

function defaultCustomRange(): DashboardRange {
    const today = new Date()
    return { from: toIsoDate(subDays(today, 13)), to: toIsoDate(today) }
}

export function DashboardPage() {
    const [preset, setPreset] = useState<RangePreset>('month')
    const [customRange, setCustomRange] = useState<DashboardRange>(defaultCustomRange)
    const showFinancials = canViewFinancials(useCurrentUser().role)

    const presetRange = useMemo(() => (preset === 'custom' ? null : rangeForPreset(preset)), [preset])
    const range = presetRange ?? customRange
    const periodLabel = describeRange(preset, range)

    const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useDashboard(range)

    const header = (
        <PageHeader
            title="Dashboard"
            description="How the business is doing, at a glance"
            actions={
                <DateRangeFilter
                    preset={preset}
                    customRange={customRange}
                    onPresetChange={setPreset}
                    onCustomRangeChange={setCustomRange}
                />
            }
        />
    )

    if (isPending) {
        return (
            <>
                {header}
                <DashboardSkeleton />
            </>
        )
    }

    if (isError && !data) {
        return (
            <>
                {header}
                <Card>
                    <EmptyState
                        icon={RotateCw}
                        title="The dashboard could not load"
                        description="Check your connection and try again. Your records are not affected."
                        action={<Button onClick={() => refetch()}>Try again</Button>}
                    />
                </Card>
            </>
        )
    }

    const { summary, finishedGoods } = data!
    const blocks = finishedGoods.filter((g) => g.kind === 'block').reduce((s, g) => s + g.pieces, 0)
    const interlockM2 = finishedGoods
        .filter((g) => g.kind === 'interlock')
        .reduce((s, g) => s + piecesToSquareMetres(g.pieces, g.piecesPerSquareMetre), 0)

    return (
        <>
            {header}
            <div
                className={isFetching && isPlaceholderData ? 'space-y-6 opacity-60 transition-opacity' : 'space-y-6 transition-opacity'}
                aria-busy={isFetching}
            >
                {showFinancials ? (
                    <>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <KpiTile label="Total sales" value={formatNaira(summary.totalSales)} note={periodLabel} />
                            <KpiTile label="Total expenses" value={formatNaira(summary.totalExpenses)} note={periodLabel} />
                            <KpiTile
                                emphasis
                                label="Estimated profit"
                                value={formatNaira(summary.estimatedProfit)}
                                note="Sales minus expenses, before approvals still pending"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <KpiTile label="Raw materials stock value" value={formatNaira(summary.rawMaterialStockValue)} note="Cement, sand, granite and water" />
                            <KpiTile
                                label="Finished goods ready for sale"
                                value={`${formatQuantity(blocks)} blocks`}
                                note={`${formatQuantity(interlockM2, 'm2')} of interlocks`}
                            />
                            <KpiTile
                                label="Customers owe"
                                value={formatNaira(summary.customerOutstanding)}
                                note={`${summary.customersWithBalance} customers with a balance`}
                            />
                            <KpiTile
                                label="You owe suppliers"
                                value={formatNaira(summary.supplierOutstanding)}
                                note={`${summary.suppliersOwed} suppliers to pay`}
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="min-w-0 lg:col-span-2">
                                <SalesTrendChart data={data!.trend} periodLabel={periodLabel} />
                            </div>
                            <SalesByCategory data={data!.salesByCategory} />
                        </div>
                    </>
                ) : (
                    // Staff see stock and production only. Money figures are for management.
                    <div className="grid gap-4 sm:grid-cols-3">
                        <KpiTile
                            label="Finished goods ready for sale"
                            value={`${formatQuantity(blocks)} blocks`}
                            note={`${formatQuantity(interlockM2, 'm2')} of interlocks`}
                        />
                        <KpiTile label="Under curing" value={`${formatQuantity(data!.production.curingNow)} pcs`} note="Not yet ready for sale" />
                        <KpiTile label="Low stock items" value={String(data!.lowStock.length)} note="Below the minimum level" />
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="min-w-0 lg:col-span-2">
                        <ProductionOverview production={data!.production} periodLabel={periodLabel} />
                    </div>
                    <LowStockList items={data!.lowStock} />
                </div>

                {showFinancials && <RecentTransactions items={data!.recentTransactions} />}
            </div>
        </>
    )
}