import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { Customer, CustomerInput } from './types'

export async function listCustomers(params: ListParams): Promise<Paginated<Customer>> {
    const response = await api.get<ApiSuccess<Paginated<Customer>>>('/customers', { params: toApiQuery(params) })
    return response.data.data
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
    const response = await api.post<ApiSuccess<Customer>>('/customers', input)
    return response.data.data
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
    const response = await api.patch<ApiSuccess<Customer>>(`/customers/${id}`, input)
    return response.data.data
}

export async function setCustomerActive(id: string, active: boolean): Promise<Customer> {
    const response = await api.post<ApiSuccess<Customer>>(`/customers/${id}/status`, { active })
    return response.data.data
}