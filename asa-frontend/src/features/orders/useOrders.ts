import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryKeys } from '@/features/inventory/useInventory'
import { catalogKeys } from '@/features/products/useCatalog'
import { customerKeys } from '@/features/customers/useCustomers'
import { saleKeys } from '@/features/sales/useSales'
import type { SaleInput } from '@/features/sales/types'
import type { ListParams } from '@/lib/listParams'
import { cancelOrder, createOrder, fulfilOrder, getOrderSummary, listOrders, updateOrder } from './orders.api'
import type { OrderInput } from './types'

export const orderKeys = {
    all: ['orders'] as const,
    list: (params: ListParams) => ['orders', 'list', params] as const,
    summary: ['orders', 'summary'] as const,
}

export function useOrderList(params: ListParams) {
    return useQuery({ queryKey: orderKeys.list(params), queryFn: () => listOrders(params), placeholderData: keepPreviousData })
}

export function useOrderSummary() {
    return useQuery({ queryKey: orderKeys.summary, queryFn: getOrderSummary })
}

function useRefreshOrders() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: orderKeys.all })
}

export function useCreateOrder() {
    const refresh = useRefreshOrders()
    return useMutation({ mutationFn: (input: OrderInput) => createOrder(input), onSuccess: refresh })
}

export function useUpdateOrder() {
    const refresh = useRefreshOrders()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: OrderInput }) => updateOrder(id, input), onSuccess: refresh })
}

export function useCancelOrder() {
    const refresh = useRefreshOrders()
    return useMutation({ mutationFn: (id: string) => cancelOrder(id), onSuccess: refresh })
}

/** Fulfilling makes a sale, so it refreshes sales, stock and customer balances as well as orders. */
export function useFulfilOrder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: SaleInput }) => fulfilOrder(id, input),
        onSuccess: () => Promise.all([orderKeys.all, saleKeys.all, inventoryKeys.all, catalogKeys.products, customerKeys.all].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
    })
}