import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { Supplier, SupplierInput } from './types'

export async function listSuppliers(params: ListParams): Promise<Paginated<Supplier>> {
    const response = await api.get<ApiSuccess<Paginated<Supplier>>>('/suppliers', { params: toApiQuery(params) })
    return response.data.data
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
    const response = await api.post<ApiSuccess<Supplier>>('/suppliers', input)
    return response.data.data
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<Supplier> {
    const response = await api.patch<ApiSuccess<Supplier>>(`/suppliers/${id}`, input)
    return response.data.data
}

export async function setSupplierActive(id: string, active: boolean): Promise<Supplier> {
    const response = await api.post<ApiSuccess<Supplier>>(`/suppliers/${id}/status`, { active })
    return response.data.data
}