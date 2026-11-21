import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { DashboardRange } from '@/types/dashboard'
import { getDashboard } from './dashboard.service'
import { isValidRange } from './dateRange'

export const dashboardKeys = {
    all: ['dashboard'] as const,
    range: (range: DashboardRange) => ['dashboard', range.from, range.to] as const,
}

export function useDashboard(range: DashboardRange) {
    return useQuery({
        queryKey: dashboardKeys.range(range),
        queryFn: () => getDashboard(range),
        enabled: isValidRange(range),
        // Keep showing the old figures while a new range loads, instead of flashing a skeleton.
        placeholderData: keepPreviousData,
    })
}