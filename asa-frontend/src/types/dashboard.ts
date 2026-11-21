import type { Unit } from '@/lib/format'
import type { StatusGroup } from '@/components/ui'

export interface DashboardRange {
    /** yyyy-MM-dd */
    from: string
    /** yyyy-MM-dd */
    to: string
}

export interface TrendPoint {
    label: string
    sales: number
    expenses: number
}

export interface ProductionPoint {
    label: string
    produced: number
    rejected: number
}

export interface FinishedGoodsLine {
    name: string
    kind: 'block' | 'interlock'
    pieces: number
    /** Interlocks only. */
    piecesPerSquareMetre?: number
}

export interface LowStockItem {
    id: string
    name: string
    current: number
    minimum: number
    unit: Unit
}

export type TransactionType = 'sale' | 'expense' | 'purchase' | 'payment'

export interface RecentTransaction {
    id: string
    type: TransactionType
    reference: string
    party: string
    /** Naira. */
    amount: number
    occurredAt: string
    statusGroup: StatusGroup
    status: string
}

export interface DashboardData {
    range: DashboardRange
    summary: {
        totalSales: number
        totalExpenses: number
        estimatedProfit: number
        rawMaterialStockValue: number
        customerOutstanding: number
        customersWithBalance: number
        supplierOutstanding: number
        suppliersOwed: number
    }
    finishedGoods: FinishedGoodsLine[]
    trend: TrendPoint[]
    production: {
        series: ProductionPoint[]
        producedInRange: number
        rejectedInRange: number
        /** Pieces currently curing and pieces ready for sale (not range based). */
        curingNow: number
        readyNow: number
    }
    salesByCategory: { category: string; amount: number }[]
    recentTransactions: RecentTransaction[]
    lowStock: LowStockItem[]
}