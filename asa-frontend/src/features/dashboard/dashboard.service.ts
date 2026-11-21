import { buildDashboard } from '@/mocks/dashboard'
import type { DashboardData, DashboardRange } from '@/types/dashboard'

/**
 * The only place the dashboard gets its data. It returns mock figures for now;
 * when the backend endpoint exists, replace the body with an Axios call and
 * nothing else in the dashboard needs to change.
 */
export async function getDashboard(range: DashboardRange): Promise<DashboardData> {
    await new Promise((resolve) => setTimeout(resolve, 350))
    return buildDashboard(range)
}