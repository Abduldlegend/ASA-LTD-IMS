import { api } from '@/lib/api'
import { toApiQuery, type ListParams } from '@/lib/listParams'
import type { ApiSuccess, Paginated } from '@/types/api'
import type { Category, CategoryInput, Product, ProductInput } from './types'

export async function listProducts(params: ListParams): Promise<Paginated<Product>> {
    const response = await api.get<ApiSuccess<Paginated<Product>>>('/products', { params: toApiQuery(params) })
    return response.data.data
}

export async function createProduct(input: ProductInput): Promise<Product> {
    const response = await api.post<ApiSuccess<Product>>('/products', input)
    return response.data.data
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
    const response = await api.patch<ApiSuccess<Product>>(`/products/${id}`, input)
    return response.data.data
}

export async function setProductActive(id: string, active: boolean): Promise<Product> {
    const response = await api.post<ApiSuccess<Product>>(`/products/${id}/status`, { active })
    return response.data.data
}

/** Categories are few, so the whole list comes at once. */
export async function listCategories(): Promise<Category[]> {
    const response = await api.get<ApiSuccess<Category[]>>('/categories')
    return response.data.data
}

export async function createCategory(input: CategoryInput): Promise<Category> {
    const response = await api.post<ApiSuccess<Category>>('/categories', input)
    return response.data.data
}

export async function renameCategory(id: string, name: string): Promise<Category> {
    const response = await api.patch<ApiSuccess<Category>>(`/categories/${id}`, { name })
    return response.data.data
}

export async function deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`)
}