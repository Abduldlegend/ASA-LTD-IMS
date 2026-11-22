/**
 * Response shapes every backend endpoint uses. The Express `ApiError` class and the
 * global error middleware must produce exactly these so the frontend can rely on them.
 */
export interface ApiSuccess<T> {
    success: true
    data: T
}

export interface ApiFailure {
    success: false
    message: string
    /** Machine-readable reason, for example "INVALID_CREDENTIALS". */
    code?: string
    /** Validation problems, keyed by form field name. */
    errors?: Record<string, string>
}

export interface Paginated<T> {
    items: T[]
    page: number
    pageSize: number
    total: number
}

/** Query string every list endpoint accepts. See toApiQuery() in lib/listParams.ts. */
export interface ListQuery {
    page: number
    pageSize: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    [filter: string]: string | number | undefined
}