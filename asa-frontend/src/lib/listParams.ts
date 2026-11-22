/**
 * The state of any list screen: which page, how many rows, what was searched,
 * how it is sorted and which filters are on. It lives in the address bar, so a
 * filtered list can be bookmarked, shared, and survives a reload or the back button.
 */
export interface SortState {
    id: string
    desc: boolean
}

export interface ListParams {
    /** Starts at 1. */
    page: number
    pageSize: number
    search: string
    sort: SortState | null
    /** Filter values by name. A filter that is not set is simply missing. */
    filters: Record<string, string>
}

export const PAGE_SIZES = [10, 20, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 20

export interface ListSchema {
    /** Columns that may be sorted, so a hand-edited address cannot ask for anything else. */
    sortable?: string[]
    /** Filter names this screen understands, each with the values it accepts. Others are dropped. */
    filters?: Record<string, readonly string[]>
    defaultSort?: SortState
    defaultPageSize?: number
}

function positiveInt(value: string | null): number | null {
    if (!value || !/^\d+$/.test(value)) return null
    const n = Number(value)
    return n > 0 ? n : null
}

/** Reads list state from the address bar. Anything invalid falls back to a safe default. */
export function parseListParams(query: URLSearchParams, schema: ListSchema = {}): ListParams {
    const defaultSize = schema.defaultPageSize ?? DEFAULT_PAGE_SIZE
    const size = positiveInt(query.get('pageSize'))
    const sortId = query.get('sort')
    const sortOk = sortId !== null && (schema.sortable?.includes(sortId) ?? false)

    const filters: Record<string, string> = {}
    for (const [name, allowed] of Object.entries(schema.filters ?? {})) {
        const value = query.get(name)
        if (value && allowed.includes(value)) filters[name] = value
    }

    return {
        page: positiveInt(query.get('page')) ?? 1,
        pageSize: size && (PAGE_SIZES as readonly number[]).includes(size) ? size : defaultSize,
        search: query.get('search')?.trim() ?? '',
        sort: sortOk ? { id: sortId, desc: query.get('order') === 'desc' } : (schema.defaultSort ?? null),
        filters,
    }
}

/**
 * Writes list state back, leaving out everything that is just the default,
 * so the address stays short: /users?role=staff&page=2
 */
export function writeListParams(params: ListParams, schema: ListSchema = {}): URLSearchParams {
    const query = new URLSearchParams()
    const defaultSize = schema.defaultPageSize ?? DEFAULT_PAGE_SIZE
    if (params.search) query.set('search', params.search)
    for (const [name, value] of Object.entries(params.filters)) query.set(name, value)
    const d = schema.defaultSort
    if (params.sort && !(d && d.id === params.sort.id && d.desc === params.sort.desc)) {
        query.set('sort', params.sort.id)
        query.set('order', params.sort.desc ? 'desc' : 'asc')
    }
    if (params.pageSize !== defaultSize) query.set('pageSize', String(params.pageSize))
    if (params.page > 1) query.set('page', String(params.page))
    return query
}

export function hasActiveFilters(params: ListParams): boolean {
    return params.search !== '' || Object.keys(params.filters).length > 0
}

export const pageCount = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize))

/**
 * What goes to the API. This is the list contract every backend list endpoint follows:
 *   GET /things?page=1&pageSize=20&search=ada&sortBy=name&sortOrder=asc&<filter>=<value>
 */
export function toApiQuery(params: ListParams): Record<string, string | number> {
    const query: Record<string, string | number> = { page: params.page, pageSize: params.pageSize, ...params.filters }
    if (params.search) query.search = params.search
    if (params.sort) {
        query.sortBy = params.sort.id
        query.sortOrder = params.sort.desc ? 'desc' : 'asc'
    }
    return query
}