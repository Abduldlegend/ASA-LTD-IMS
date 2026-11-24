import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/lib/listParams'
import { createCustomer, listCustomers, setCustomerActive, updateCustomer } from './customers.api'
import type { CustomerInput } from './types'

export const customerKeys = {
    all: ['customers'] as const,
    list: (params: ListParams) => ['customers', 'list', params] as const,
}

export function useCustomerList(params: ListParams) {
    return useQuery({ queryKey: customerKeys.list(params), queryFn: () => listCustomers(params), placeholderData: keepPreviousData })
}

function useRefresh() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: customerKeys.all })
}

export function useCreateCustomer() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: (input: CustomerInput) => createCustomer(input), onSuccess: refresh })
}

export function useUpdateCustomer() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => updateCustomer(id, input), onSuccess: refresh })
}

export function useSetCustomerActive() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => setCustomerActive(id, active), onSuccess: refresh })
}