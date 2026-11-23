import type { InternalAxiosRequestConfig } from 'axios'
import type { Paginated } from '@/types/api'
import { queryOf } from './http'

/** Sorts and pages rows the way the real list endpoints do. Only the keys in `sortable` can be sorted by. */
export function paginate<T>(config: InternalAxiosRequestConfig, rows: T[], sortable: (keyof T & string)[]): Paginated<T> {
    const q = queryOf(config)
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20))
    const sortBy = sortable.find((k) => k === q.sortBy) ?? sortable[0]
    const direction = q.sortOrder === 'desc' ? -1 : 1
    const sorted = [...rows].sort((a, b) => {
        const [x, y] = [a[sortBy], b[sortBy]]
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { sensitivity: 'base' })) * direction
    })
    return { items: sorted.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: rows.length }
}