import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { RawMaterial, RawMaterialInput } from './types'

export async function listRawMaterials(params: ListParams): Promise<Paginated<RawMaterial>> {
    const response = await api.get<ApiSuccess<Paginated<RawMaterial>>>('/raw-materials', { params: toApiQuery(params) })
    return response.data.data
}

export async function createRawMaterial(input: RawMaterialInput): Promise<RawMaterial> {
    const response = await api.post<ApiSuccess<RawMaterial>>('/raw-materials', input)
    return response.data.data
}

export async function updateRawMaterial(id: string, input: RawMaterialInput): Promise<RawMaterial> {
    const response = await api.patch<ApiSuccess<RawMaterial>>(`/raw-materials/${id}`, input)
    return response.data.data
}

export async function setRawMaterialActive(id: string, active: boolean): Promise<RawMaterial> {
    const response = await api.post<ApiSuccess<RawMaterial>>(`/raw-materials/${id}/status`, { active })
    return response.data.data
}