import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { PaymentInput, Sale, SaleInput, SalesSummary } from './types'

export async function listSales(params: ListParams): Promise<Paginated<Sale>> {
    const response = await api.get<ApiSuccess<Paginated<Sale>>>('/sales', { params: toApiQuery(params) })
    return response.data.data
}

/** Management only: the server answers 403 to anyone else. */
export async function getSalesSummary(): Promise<SalesSummary> {
    const response = await api.get<ApiSuccess<SalesSummary>>('/sales/summary')
    return response.data.data
}

/** Takes the pieces out of stock and, for anything not paid now, adds to what the customer owes. */
export async function createSale(input: SaleInput): Promise<Sale> {
    const response = await api.post<ApiSuccess<Sale>>('/sales', input)
    return response.data.data
}

export async function recordPayment(id: string, input: PaymentInput): Promise<Sale> {
    const response = await api.post<ApiSuccess<Sale>>(`/sales/${id}/payments`, input)
    return response.data.data
}

/** Management only. Puts the pieces back in stock and clears what the customer owed on it. */
export async function cancelSale(id: string): Promise<Sale> {
    const response = await api.post<ApiSuccess<Sale>>(`/sales/${id}/cancel`)
    return response.data.data
}