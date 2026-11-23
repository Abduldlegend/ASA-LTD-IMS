import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rawMaterialKeys } from '@/features/rawMaterials/useRawMaterials'
import { catalogKeys } from '@/features/products/useCatalog'
import type { ListParams } from '@/lib/listParams'
import { createAdjustment, getStockSummary, listMovements, listStockItems } from './inventory.api'
import type { AdjustmentInput } from './types'

export const inventoryKeys = {
    all: ['inventory'] as const,
    items: (params: ListParams) => ['inventory', 'items', params] as const,
    summary: ['inventory', 'summary'] as const,
    movements: (params: ListParams) => ['inventory', 'movements', params] as const,
}

export function useStockItems(params: ListParams) {
    return useQuery({ queryKey: inventoryKeys.items(params), queryFn: () => listStockItems(params), placeholderData: keepPreviousData })
}

export function useStockSummary() {
    return useQuery({ queryKey: inventoryKeys.summary, queryFn: getStockSummary })
}

export function useMovements(params: ListParams) {
    return useQuery({ queryKey: inventoryKeys.movements(params), queryFn: () => listMovements(params), placeholderData: keepPreviousData })
}

/** Stock is shown on the products and raw-materials screens too, so a change refreshes all three. */
export function useAdjustStock() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: AdjustmentInput) => createAdjustment(input),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
                queryClient.invalidateQueries({ queryKey: catalogKeys.products }),
                queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all }),
            ]),
    })
}