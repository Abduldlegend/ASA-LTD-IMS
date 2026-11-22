import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/lib/listParams'
import { createUser, listUsers, setUserActive, updateUser } from './users.api'
import type { NewUserInput, UserInput } from './types'

/**
 * Query keys are built in one place. `all` is the prefix of every users query, so
 * invalidating it refreshes every list however it was sorted or filtered.
 */
export const usersKeys = {
    all: ['users'] as const,
    list: (params: ListParams) => ['users', 'list', params] as const,
}

export function useUsersList(params: ListParams) {
    return useQuery({
        queryKey: usersKeys.list(params),
        queryFn: () => listUsers(params),
        // Keep the old rows on screen (dimmed) while the next page, sort or search loads.
        placeholderData: keepPreviousData,
    })
}

/** Every change refreshes the lists, so the screen shows what the server now holds. */
function useRefreshUsers() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: usersKeys.all })
}

export function useCreateUser() {
    const refresh = useRefreshUsers()
    return useMutation({ mutationFn: (input: NewUserInput) => createUser(input), onSuccess: refresh })
}

export function useUpdateUser() {
    const refresh = useRefreshUsers()
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: UserInput }) => updateUser(id, input), onSuccess: refresh })
}

export function useSetUserActive() {
    const refresh = useRefreshUsers()
    return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active), onSuccess: refresh })
}