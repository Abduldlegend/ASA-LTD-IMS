import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/lib/listParams'
import { createSupplier, listSuppliers, setSupplierActive, updateSupplier } from './suppliers.api'
import type { SupplierInput } from './types'

export const supplierKeys = {
    all: ['suppliers'] as const,
    list: (params: ListParams) => ['suppliers', 'list', params] as const,
}

export function useSupplierList(params: ListParams) {
    return useQuery({ queryKey: supplierKeys.list(params), queryFn: () => listSuppliers(params), placeholderData: keepPreviousData })
}

function useRefresh() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: supplierKeys.all })
}

export function useCreateSupplier() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: (input: SupplierInput) => createSupplier(input), onSuccess: refresh })
}

export function useUpdateSupplier() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: SupplierInput }) => updateSupplier(id, input), onSuccess: refresh })
}

export function useSetSupplierActive() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => setSupplierActive(id, active), onSuccess: refresh })
}