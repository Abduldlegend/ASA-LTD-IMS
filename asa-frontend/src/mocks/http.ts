import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiFailure } from '@/types/api'

/**
 * Shared plumbing for the mock API. Each mock module lists its routes, and mockApi.ts answers
 * requests from them, the way the real server will: same URLs, same JSON shapes, same status codes.
 */

export const network = { delayMs: 400 }

type Handler = (config: InternalAxiosRequestConfig, params: Record<string, string>) => AxiosResponse | Promise<AxiosResponse>
export type Route = [route: string, handler: Handler]

/** Finds the handler for "GET /users/u-12" among routes such as "GET /users/:id". */
export function matchRoute(routes: Route[], method: string, url: string) {
    const path = url.split('?')[0]
    for (const [route, handler] of routes) {
        const [routeMethod, pattern] = route.split(' ')
        if (routeMethod !== method) continue
        const names: string[] = []
        const regex = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, name: string) => (names.push(name), '([^/]+)'))}$`)
        const found = regex.exec(path)
        if (found) return { handler, params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(found[i + 1])])) }
    }
    return null
}

// ---------------------------------------------------------------- reset (used by tests)

const resetters: (() => void)[] = []
export const onMockReset = (fn: () => void) => void resetters.push(fn)
export const resetMocks = () => resetters.forEach((fn) => fn())

// ---------------------------------------------------------------- responses

export function respond<T>(config: InternalAxiosRequestConfig, status: number, body: unknown): AxiosResponse<T> {
    return { data: body as T, status, statusText: String(status), headers: new AxiosHeaders(), config }
}

export const ok = (config: InternalAxiosRequestConfig, data: unknown, status = 200) =>
    respond(config, status, { success: true, data })

export function fail(config: InternalAxiosRequestConfig, status: number, body: Omit<ApiFailure, 'success'>): never {
    const response = respond(config, status, { success: false, ...body })
    throw new AxiosError(body.message, status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, null, response)
}

export function bodyOf(config: InternalAxiosRequestConfig): Record<string, unknown> {
    try {
        const raw = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
        return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    } catch {
        return {}
    }
}

/** Query-string values of a GET request, as text. */
export function queryOf(config: InternalAxiosRequestConfig): Record<string, string> {
    return Object.fromEntries(Object.entries(config.params ?? {}).map(([k, v]) => [k, String(v)]))
}