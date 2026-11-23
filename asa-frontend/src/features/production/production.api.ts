import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { BatchInput, CompleteBatchInput, ProductionBatch, ProductionSummary } from './types'

export async function listBatches(params: ListParams): Promise<Paginated<ProductionBatch>> {
    const response = await api.get<ApiSuccess<Paginated<ProductionBatch>>>('/production/batches', { params: toApiQuery(params) })
    return response.data.data
}

export async function getProductionSummary(): Promise<ProductionSummary> {
    const response = await api.get<ApiSuccess<ProductionSummary>>('/production/summary')
    return response.data.data
}

/** Uses up the raw materials. The pieces join sellable stock later, when the batch is checked. */
export async function recordBatch(input: BatchInput): Promise<ProductionBatch> {
    const response = await api.post<ApiSuccess<ProductionBatch>>('/production/batches', input)
    return response.data.data
}

export async function completeBatch(id: string, input: CompleteBatchInput): Promise<ProductionBatch> {
    const response = await api.post<ApiSuccess<ProductionBatch>>(`/production/batches/${id}/complete`, input)
    return response.data.data
}