import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { ManagedUser, NewUserInput, UserInput } from './types'

export async function listUsers(params: ListParams): Promise<Paginated<ManagedUser>> {
    const response = await api.get<ApiSuccess<Paginated<ManagedUser>>>('/users', { params: toApiQuery(params) })
    return response.data.data
}

export async function createUser(input: NewUserInput): Promise<ManagedUser> {
    const response = await api.post<ApiSuccess<ManagedUser>>('/users', input)
    return response.data.data
}

export async function updateUser(id: string, input: UserInput): Promise<ManagedUser> {
    const response = await api.patch<ApiSuccess<ManagedUser>>(`/users/${id}`, input)
    return response.data.data
}

export async function setUserActive(id: string, active: boolean): Promise<ManagedUser> {
    const response = await api.post<ApiSuccess<ManagedUser>>(`/users/${id}/status`, { active })
    return response.data.data
}