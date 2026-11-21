import { buildDashboard } from '@/mocks/dashboard'

describe('mock dashboard data', () => {
    const week = { from: '2026-11-16', to: '2026-11-20' }

    it('is repeatable for the same range', () => {
        const now = new Date(2026, 10, 20, 15, 30)
        expect(buildDashboard(week, now)).toEqual(buildDashboard(week, now))
    })
    it('keeps profit equal to sales minus expenses', () => {
        const { summary } = buildDashboard(week)
        expect(summary.estimatedProfit).toBe(summary.totalSales - summary.totalExpenses)
    })
    it('splits a single day into hours that add back to the day total', () => {
        const data = buildDashboard({ from: '2026-11-20', to: '2026-11-20' })
        expect(data.trend).toHaveLength(10)
        const hourly = data.trend.reduce((s, p) => s + p.sales, 0)
        expect(Math.abs(hourly - data.summary.totalSales)).toBeLessThan(600)
    })
    it('charts one point per day for a week', () => {
        expect(buildDashboard(week).trend).toHaveLength(5)
    })
    it('groups long ranges by week', () => {
        const data = buildDashboard({ from: '2026-01-01', to: '2026-11-20' })
        expect(data.trend.length).toBeLessThan(60)
    })
    it('splits sales across categories without losing money', () => {
        const data = buildDashboard(week)
        const total = data.salesByCategory.reduce((s, c) => s + c.amount, 0)
        expect(Math.abs(total - data.summary.totalSales)).toBeLessThan(200)
    })
    it('never counts rejected products as ready stock', () => {
        const data = buildDashboard(week)
        expect(data.production.rejectedInRange).toBeLessThan(data.production.producedInRange)
    })
})