import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryKeys } from '@/features/inventory/useInventory'
import { listProducts } from '@/features/products/catalog.api'
import { catalogKeys } from '@/features/products/useCatalog'
import { listRawMaterials } from '@/features/rawMaterials/rawMaterials.api'
import { rawMaterialKeys } from '@/features/rawMaterials/useRawMaterials'
import type { ListParams } from '@/lib/listParams'
import { completeBatch, getProductionSummary, listBatches, recordBatch } from './production.api'
import type { BatchInput, CompleteBatchInput } from './types'

export const productionKeys = {
    all: ['production'] as const,
    list: (params: ListParams) => ['production', 'list', params] as const,
    summary: ['production', 'summary'] as const,
}

export function useBatchList(params: ListParams) {
    return useQuery({ queryKey: productionKeys.list(params), queryFn: () => listBatches(params), placeholderData: keepPreviousData })
}

export function useProductionSummary() {
    return useQuery({ queryKey: productionKeys.summary, queryFn: getProductionSummary })
}

const EVERYTHING_ACTIVE: ListParams = { page: 1, pageSize: 100, search: '', sort: { id: 'name', desc: false }, filters: { status: 'active' } }

/** The choices on the "record a batch" form. They sit under the products and raw-materials keys, so changes there refresh them. */
export function useBatchProducts(enabled: boolean) {
    return useQuery({ queryKey: [...catalogKeys.products, 'options'], queryFn: () => listProducts(EVERYTHING_ACTIVE), enabled })
}

export function useBatchMaterials(enabled: boolean) {
    return useQuery({ queryKey: [...rawMaterialKeys.all, 'options'], queryFn: () => listRawMaterials(EVERYTHING_ACTIVE), enabled })
}

/** A batch changes raw-material stock, and later finished stock, so it refreshes those screens too. */
function useRefreshAll() {
    const queryClient = useQueryClient()
    return () =>
        Promise.all(
            [productionKeys.all, inventoryKeys.all, catalogKeys.products, rawMaterialKeys.all].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        )
}

export function useRecordBatch() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: (input: BatchInput) => recordBatch(input), onSuccess: refresh })
}

export function useCompleteBatch() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: CompleteBatchInput }) => completeBatch(id, input), onSuccess: refresh })
}