import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/lib/listParams'
import { createRawMaterial, listRawMaterials, setRawMaterialActive, updateRawMaterial } from './rawMaterials.api'
import type { RawMaterialInput } from './types'

export const rawMaterialKeys = {
    all: ['raw-materials'] as const,
    list: (params: ListParams) => ['raw-materials', 'list', params] as const,
}

export function useRawMaterialList(params: ListParams) {
    return useQuery({ queryKey: rawMaterialKeys.list(params), queryFn: () => listRawMaterials(params), placeholderData: keepPreviousData })
}

function useRefresh() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all })
}

export function useCreateRawMaterial() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: (input: RawMaterialInput) => createRawMaterial(input), onSuccess: refresh })
}

export function useUpdateRawMaterial() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: RawMaterialInput }) => updateRawMaterial(id, input), onSuccess: refresh })
}

export function useSetRawMaterialActive() {
    const refresh = useRefresh()
    return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => setRawMaterialActive(id, active), onSuccess: refresh })
}