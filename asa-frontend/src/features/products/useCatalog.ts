import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/lib/listParams'
import {
    createCategory,
    createProduct,
    deleteCategory,
    listCategories,
    listProducts,
    renameCategory,
    setProductActive,
    updateProduct,
} from './catalog.api'
import type { CategoryInput, ProductInput } from './types'

export const catalogKeys = {
    products: ['products'] as const,
    productList: (params: ListParams) => ['products', 'list', params] as const,
    categories: ['categories'] as const,
}

export function useProductList(params: ListParams) {
    return useQuery({
        queryKey: catalogKeys.productList(params),
        queryFn: () => listProducts(params),
        placeholderData: keepPreviousData,
    })
}

export function useCategories() {
    return useQuery({ queryKey: catalogKeys.categories, queryFn: listCategories })
}

/**
 * Products show their category's name and categories count their products, so a change to
 * either one refreshes both.
 */
function useRefreshCatalog() {
    const queryClient = useQueryClient()
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: catalogKeys.products }),
            queryClient.invalidateQueries({ queryKey: catalogKeys.categories }),
        ])
}

export function useCreateProduct() {
    const refresh = useRefreshCatalog()
    return useMutation({ mutationFn: (input: ProductInput) => createProduct(input), onSuccess: refresh })
}

export function useUpdateProduct() {
    const refresh = useRefreshCatalog()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: ProductInput }) => updateProduct(id, input), onSuccess: refresh })
}

export function useSetProductActive() {
    const refresh = useRefreshCatalog()
    return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => setProductActive(id, active), onSuccess: refresh })
}

export function useCreateCategory() {
    const refresh = useRefreshCatalog()
    return useMutation({ mutationFn: (input: CategoryInput) => createCategory(input), onSuccess: refresh })
}

export function useRenameCategory() {
    const refresh = useRefreshCatalog()
    return useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => renameCategory(id, name), onSuccess: refresh })
}

export function useDeleteCategory() {
    const refresh = useRefreshCatalog()
    return useMutation({ mutationFn: (id: string) => deleteCategory(id), onSuccess: refresh })
}