import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { Sale, SaleInput } from '@/features/sales/types'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { Order, OrderInput, OrderSummary } from './types'

export async function listOrders(params: ListParams): Promise<Paginated<Order>> {
    const response = await api.get<ApiSuccess<Paginated<Order>>>('/orders', { params: toApiQuery(params) })
    return response.data.data
}

export async function getOrderSummary(): Promise<OrderSummary> {
    const response = await api.get<ApiSuccess<OrderSummary>>('/orders/summary')
    return response.data.data
}

export async function createOrder(input: OrderInput): Promise<Order> {
    const response = await api.post<ApiSuccess<Order>>('/orders', input)
    return response.data.data
}

/** Only an open order can be changed. */
export async function updateOrder(id: string, input: OrderInput): Promise<Order> {
    const response = await api.patch<ApiSuccess<Order>>(`/orders/${id}`, input)
    return response.data.data
}

export async function cancelOrder(id: string): Promise<Order> {
    const response = await api.post<ApiSuccess<Order>>(`/orders/${id}/cancel`)
    return response.data.data
}

/** Records the sale for this order, for the order's own customer, and marks the order fulfilled. Returns the sale. */
export async function fulfilOrder(id: string, input: SaleInput): Promise<Sale> {
    const response = await api.post<ApiSuccess<Sale>>(`/orders/${id}/fulfil`, input)
    return response.data.data
}