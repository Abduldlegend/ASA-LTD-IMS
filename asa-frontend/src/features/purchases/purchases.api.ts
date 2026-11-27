import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { ApproveInput, Purchase, PurchaseInput, PurchaseItem, PurchasePaymentInput, PurchaseSummary } from './types'

export async function listPurchases(params: ListParams): Promise<Paginated<Purchase>> {
    const response = await api.get<ApiSuccess<Paginated<Purchase>>>('/purchases', { params: toApiQuery(params) })
    return response.data.data
}

export async function getPurchaseSummary(): Promise<PurchaseSummary> {
    const response = await api.get<ApiSuccess<PurchaseSummary>>('/purchases/summary')
    return response.data.data
}

/** What can be bought: active raw materials and cement, with the stock of each. */
export async function listPurchaseItems(): Promise<PurchaseItem[]> {
    const response = await api.get<ApiSuccess<PurchaseItem[]>>('/purchases/items')
    return response.data.data
}

/** The goods go into stock straight away. Staff send no costs, so the purchase waits for management to price it. */
export async function createPurchase(input: PurchaseInput): Promise<Purchase> {
    const response = await api.post<ApiSuccess<Purchase>>('/purchases', input)
    return response.data.data
}

/** Management only. */
export async function approvePurchase(id: string, input: ApproveInput): Promise<Purchase> {
    const response = await api.post<ApiSuccess<Purchase>>(`/purchases/${id}/approve`, input)
    return response.data.data
}

/** Management only. Takes the goods back out of stock, so it fails if some of them have already been used. */
export async function rejectPurchase(id: string): Promise<Purchase> {
    const response = await api.post<ApiSuccess<Purchase>>(`/purchases/${id}/reject`)
    return response.data.data
}

/** Management only. */
export async function payPurchase(id: string, input: PurchasePaymentInput): Promise<Purchase> {
    const response = await api.post<ApiSuccess<Purchase>>(`/purchases/${id}/payments`, input)
    return response.data.data
}