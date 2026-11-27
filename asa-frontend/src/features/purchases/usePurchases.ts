import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryKeys } from '@/features/inventory/useInventory'
import { catalogKeys } from '@/features/products/useCatalog'
import { rawMaterialKeys } from '@/features/rawMaterials/useRawMaterials'
import { listSuppliers } from '@/features/suppliers/suppliers.api'
import { supplierKeys } from '@/features/suppliers/useSuppliers'
import type { ListParams } from '@/lib/listParams'
import { approvePurchase, createPurchase, getPurchaseSummary, listPurchaseItems, listPurchases, payPurchase, rejectPurchase } from './purchases.api'
import type { ApproveInput, PurchaseInput, PurchasePaymentInput } from './types'

export const purchaseKeys = {
    all: ['purchases'] as const,
    list: (params: ListParams) => ['purchases', 'list', params] as const,
    summary: ['purchases', 'summary'] as const,
    items: ['purchases', 'items'] as const,
}

export function usePurchaseList(params: ListParams) {
    return useQuery({ queryKey: purchaseKeys.list(params), queryFn: () => listPurchases(params), placeholderData: keepPreviousData })
}

export function usePurchaseSummary() {
    return useQuery({ queryKey: purchaseKeys.summary, queryFn: getPurchaseSummary })
}

export function usePurchaseItems(enabled: boolean) {
    return useQuery({ queryKey: purchaseKeys.items, queryFn: listPurchaseItems, enabled })
}

const ACTIVE: ListParams = { page: 1, pageSize: 100, search: '', sort: { id: 'name', desc: false }, filters: { status: 'active' } }

export function useSupplierOptions(enabled: boolean) {
    return useQuery({ queryKey: [...supplierKeys.all, 'options'], queryFn: () => listSuppliers(ACTIVE), enabled })
}

/** A purchase moves stock, material costs and what we owe suppliers, so it refreshes those screens too. */
function useRefreshAll() {
    const queryClient = useQueryClient()
    return () => Promise.all([purchaseKeys.all, inventoryKeys.all, catalogKeys.products, rawMaterialKeys.all, supplierKeys.all].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}

export function useCreatePurchase() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: (input: PurchaseInput) => createPurchase(input), onSuccess: refresh })
}

export function useApprovePurchase() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: ApproveInput }) => approvePurchase(id, input), onSuccess: refresh })
}

export function useRejectPurchase() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: (id: string) => rejectPurchase(id), onSuccess: refresh })
}

export function usePayPurchase() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: PurchasePaymentInput }) => payPurchase(id, input), onSuccess: refresh })
}