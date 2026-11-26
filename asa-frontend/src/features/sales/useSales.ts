import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerKeys } from '@/features/customers/useCustomers'
import { listCustomers } from '@/features/customers/customers.api'
import { inventoryKeys } from '@/features/inventory/useInventory'
import { listProducts } from '@/features/products/catalog.api'
import { catalogKeys } from '@/features/products/useCatalog'
import type { ListParams } from '@/lib/listParams'
import { cancelSale, createSale, getSalesSummary, listSales, recordPayment } from './sales.api'
import type { PaymentInput, SaleInput } from './types'

export const saleKeys = {
    all: ['sales'] as const,
    list: (params: ListParams) => ['sales', 'list', params] as const,
    summary: ['sales', 'summary'] as const,
}

export function useSaleList(params: ListParams) {
    return useQuery({ queryKey: saleKeys.list(params), queryFn: () => listSales(params), placeholderData: keepPreviousData })
}

export function useSalesSummary(enabled: boolean) {
    return useQuery({ queryKey: saleKeys.summary, queryFn: getSalesSummary, enabled })
}

const ACTIVE: ListParams = { page: 1, pageSize: 100, search: '', sort: { id: 'name', desc: false }, filters: { status: 'active' } }

/** What can be put on a sale. They sit under the products and customers keys, so changes there refresh them. */
export function useSaleProducts(enabled: boolean) {
    return useQuery({ queryKey: [...catalogKeys.products, 'sale-options'], queryFn: () => listProducts(ACTIVE), enabled })
}

export function useSaleCustomers(enabled: boolean) {
    return useQuery({ queryKey: [...customerKeys.all, 'sale-options'], queryFn: () => listCustomers(ACTIVE), enabled })
}

/** A sale moves stock and what a customer owes, so it refreshes those screens too. */
function useRefreshAll() {
    const queryClient = useQueryClient()
    return () => Promise.all([saleKeys.all, inventoryKeys.all, catalogKeys.products, customerKeys.all].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}

export function useCreateSale() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: (input: SaleInput) => createSale(input), onSuccess: refresh })
}

export function useRecordPayment() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: PaymentInput }) => recordPayment(id, input), onSuccess: refresh })
}

export function useCancelSale() {
    const refresh = useRefreshAll()
    return useMutation({ mutationFn: (id: string) => cancelSale(id), onSuccess: refresh })
}