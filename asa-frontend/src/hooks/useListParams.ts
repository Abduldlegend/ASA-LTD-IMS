import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseListParams, writeListParams, type ListParams, type ListSchema, type SortState } from '@/lib/listParams'

/**
 * List state kept in the address bar. Changing the search, a filter, the sort or the page size
 * sends the user back to page 1, because the old page number may no longer exist.
 * The schema should be a constant outside the component.
 */
export function useListParams(schema: ListSchema) {
    const [query, setQuery] = useSearchParams()
    const params = useMemo(() => parseListParams(query, schema), [query, schema])

    const update = useCallback(
        (change: Partial<ListParams>, options: { resetPage?: boolean; replace?: boolean } = {}) => {
            const { resetPage = true, replace = false } = options
            setQuery(writeListParams({ ...params, ...(resetPage ? { page: 1 } : null), ...change }, schema), { replace })
        },
        [params, schema, setQuery],
    )

    return {
        params,
        setPage: (page: number) => update({ page }, { resetPage: false }),
        setPageSize: (pageSize: number) => update({ pageSize }),
        // Typing in the search box should not fill the back button with history.
        setSearch: (search: string) => update({ search: search.trim() }, { replace: true }),
        setSort: (sort: SortState | null) => update({ sort }),
        setFilter: (name: string, value: string | null) => {
            const filters = { ...params.filters }
            if (value) filters[name] = value
            else delete filters[name]
            update({ filters })
        },
        clearAll: () => update({ search: '', filters: {} }),
    }
}