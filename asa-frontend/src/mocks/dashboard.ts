import {
    eachDayOfInterval,
    format,
    getDay,
    parseISO,
    startOfWeek,
    subDays,
    subMinutes,
} from 'date-fns'
import { daysInRange } from '@/features/dashboard/dateRange'
import type {
    DashboardData,
    DashboardRange,
    FinishedGoodsLine,
    LowStockItem,
    ProductionPoint,
    RecentTransaction,
    TrendPoint,
} from '@/types/dashboard'

/** Small seeded random generator so the same date always gives the same figures. */
function seeded(seed: string) {
    let h = 1779033703 ^ seed.length
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
        h = (h << 13) | (h >>> 19)
    }
    let a = h
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

interface DayFigures {
    date: Date
    sales: number
    expenses: number
    produced: number
    rejected: number
}

function figuresFor(date: Date): DayFigures {
    const key = format(date, 'yyyy-MM-dd')
    const rand = seeded(key)
    const sunday = getDay(date) === 0
    const sales = sunday ? roundTo(60_000 + rand() * 90_000, 50) : roundTo(420_000 + rand() * 520_000, 50)
    const expenses = roundTo(sales * (0.38 + rand() * 0.22), 50)
    const produced = sunday ? 0 : Math.round(1800 + rand() * 1500)
    const rejected = Math.round(produced * (0.015 + rand() * 0.025))
    return { date, sales, expenses, produced, rejected }
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const hourLabel = (h: number) => (h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`)

function hourlyTrend(day: DayFigures): TrendPoint[] {
    const rand = seeded(`hours-${format(day.date, 'yyyy-MM-dd')}`)
    const salesWeights = HOURS.map(() => 0.4 + rand())
    const expenseWeights = HOURS.map((h) => (h < 12 ? 1.5 : 0.5) * (0.4 + rand()))
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
    return HOURS.map((h, i) => ({
        label: hourLabel(h),
        sales: roundTo((day.sales * salesWeights[i]) / sum(salesWeights), 50),
        expenses: roundTo((day.expenses * expenseWeights[i]) / sum(expenseWeights), 50),
    }))
}

function dailyTrend(days: DayFigures[]): TrendPoint[] {
    return days.map((d) => ({ label: format(d.date, 'd MMM'), sales: d.sales, expenses: d.expenses }))
}

function weeklyTrend(days: DayFigures[]): TrendPoint[] {
    const weeks = new Map<string, TrendPoint>()
    for (const d of days) {
        const start = startOfWeek(d.date, { weekStartsOn: 1 })
        const key = format(start, 'yyyy-MM-dd')
        const week = weeks.get(key) ?? { label: format(start, 'd MMM'), sales: 0, expenses: 0 }
        week.sales += d.sales
        week.expenses += d.expenses
        weeks.set(key, week)
    }
    return [...weeks.values()]
}

const FINISHED_GOODS: FinishedGoodsLine[] = [
    { name: '6-inch blocks', kind: 'block', pieces: 1_850 },
    { name: '9-inch blocks', kind: 'block', pieces: 4_200 },
    { name: 'Double T interlocks', kind: 'interlock', pieces: 6_400, piecesPerSquareMetre: 32 },
    { name: 'I-Shape interlocks', kind: 'interlock', pieces: 5_000, piecesPerSquareMetre: 50 },
]

const LOW_STOCK: LowStockItem[] = [
    { id: 'ls1', name: 'BUA cement', current: 0, minimum: 100, unit: 'bags' },
    { id: 'ls2', name: 'Dangote cement', current: 45, minimum: 150, unit: 'bags' },
    { id: 'ls3', name: 'Granite', current: 2, minimum: 6, unit: 'trips' },
    { id: 'ls4', name: 'Sand', current: 1, minimum: 4, unit: 'trips' },
    { id: 'ls5', name: '6-inch blocks', current: 180, minimum: 500, unit: 'pcs' },
]

function recentTransactions(now: Date): RecentTransaction[] {
    const at = (minutesAgo: number) => subMinutes(now, minutesAgo).toISOString()
    return [
        { id: 't1', type: 'sale', reference: 'INV-02418', party: 'Musa Contractors', amount: 486_000, occurredAt: at(25), statusGroup: 'payment', status: 'paid' },
        { id: 't2', type: 'sale', reference: 'INV-02417', party: 'Hajiya Zainab Bello', amount: 128_500, occurredAt: at(80), statusGroup: 'payment', status: 'partial' },
        { id: 't3', type: 'expense', reference: 'EXP-00731', party: 'Diesel for the delivery truck', amount: 62_000, occurredAt: at(130), statusGroup: 'approval', status: 'pending' },
        { id: 't4', type: 'purchase', reference: 'PUR-00164', party: 'Kaduna Sand and Stone Ltd', amount: 340_000, occurredAt: at(210), statusGroup: 'approval', status: 'approved' },
        { id: 't5', type: 'sale', reference: 'INV-02416', party: 'Ibrahim Yusuf', amount: 92_000, occurredAt: at(290), statusGroup: 'payment', status: 'unpaid' },
        { id: 't6', type: 'payment', reference: 'PAY-00522', party: 'Northgate Builders', amount: 250_000, occurredAt: at(370), statusGroup: 'payment', status: 'paid' },
        { id: 't7', type: 'expense', reference: 'EXP-00730', party: 'Daily wages, production crew', amount: 85_000, occurredAt: at(480), statusGroup: 'approval', status: 'approved' },
        { id: 't8', type: 'sale', reference: 'INV-02415', party: 'Danladi Estate Projects', amount: 614_000, occurredAt: at(610), statusGroup: 'payment', status: 'paid' },
    ]
}

const SALES_SHARES: [string, number][] = [
    ['Interlocks', 0.46],
    ['Blocks', 0.32],
    ['Cement', 0.22],
]

/** Builds dashboard figures for a date range, mirroring what the real API will return. */
export function buildDashboard(range: DashboardRange, now: Date = new Date()): DashboardData {
    const from = parseISO(range.from)
    const to = parseISO(range.to)
    const days = eachDayOfInterval({ start: from, end: to }).map(figuresFor)
    const count = daysInRange(range)

    const totalSales = days.reduce((s, d) => s + d.sales, 0)
    const totalExpenses = days.reduce((s, d) => s + d.expenses, 0)

    const trend = count === 1 ? hourlyTrend(days[0]) : count > 62 ? weeklyTrend(days) : dailyTrend(days)

    // Production chart: the range itself, or the week up to the chosen day when it is a single day.
    const productionDays =
        count === 1
            ? eachDayOfInterval({ start: subDays(to, 6), end: to }).map(figuresFor)
            : days.slice(-31)
    const series: ProductionPoint[] = productionDays.map((d) => ({
        label: format(d.date, count === 1 ? 'EEE d' : 'd MMM'),
        produced: d.produced,
        rejected: d.rejected,
    }))

    return {
        range,
        summary: {
            totalSales,
            totalExpenses,
            estimatedProfit: totalSales - totalExpenses,
            rawMaterialStockValue: 4_850_000,
            customerOutstanding: 3_215_000,
            customersWithBalance: 17,
            supplierOutstanding: 1_620_000,
            suppliersOwed: 4,
        },
        finishedGoods: FINISHED_GOODS,
        trend,
        production: {
            series,
            producedInRange: days.reduce((s, d) => s + d.produced, 0),
            rejectedInRange: days.reduce((s, d) => s + d.rejected, 0),
            curingNow: 3_150,
            readyNow: FINISHED_GOODS.reduce((s, g) => s + g.pieces, 0),
        },
        salesByCategory: SALES_SHARES.map(([category, share]) => ({
            category,
            amount: roundTo(totalSales * share, 50),
        })),
        recentTransactions: recentTransactions(now),
        lowStock: LOW_STOCK,
    }
}