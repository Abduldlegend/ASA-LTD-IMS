import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { AdjustmentInput, StockItem, StockMovement, StockSummary } from './types'

export async function listStockItems(params: ListParams): Promise<Paginated<StockItem>> {
    const response = await api.get<ApiSuccess<Paginated<StockItem>>>('/inventory/items', { params: toApiQuery(params) })
    return response.data.data
}

export async function getStockSummary(): Promise<StockSummary> {
    const response = await api.get<ApiSuccess<StockSummary>>('/inventory/summary')
    return response.data.data
}

export async function listMovements(params: ListParams): Promise<Paginated<StockMovement>> {
    const response = await api.get<ApiSuccess<Paginated<StockMovement>>>('/inventory/movements', { params: toApiQuery(params) })
    return response.data.data
}

/** Returns the movement it recorded, which carries the new balance. */
export async function createAdjustment(input: AdjustmentInput): Promise<StockMovement> {
    const response = await api.post<ApiSuccess<StockMovement>>('/inventory/adjustments', input)
    return response.data.data
}