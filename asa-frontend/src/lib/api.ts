import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiSuccess } from '@/types/api'
import type { User } from '@/types/user'
import { toApiError } from './apiError'
import { env } from './env'
import { tokenStore } from './tokenStore'

export interface AuthSession {
    accessToken: string
    user: User
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

export const api = axios.create({
    baseURL: env.apiBaseUrl,
    // Sends and receives the HTTP-only refresh-token cookie.
    withCredentials: true,
    timeout: 15_000,
    // With mocks on, requests are answered by src/mocks/authServer.ts instead of the network.
    // When mocks are off, __USE_MOCKS__ is false at build time and none of that code is in the build.
    adapter: __USE_MOCKS__ ? (config) => import('../mocks/mockApi').then((m) => m.mockAdapter(config)) : undefined,
})

// ---------------------------------------------------------------- session expiry

let onSessionExpired: (() => void) | null = null

/** The auth provider registers here, so a dead session can sign the user out from anywhere. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
    onSessionExpired = handler
}

// ---------------------------------------------------------------- refresh (single flight)

let refreshing: Promise<AuthSession> | null = null

/**
 * Asks the server for a new access token using the refresh cookie.
 * If several requests fail at once they all wait for the same refresh, which matters
 * because refresh tokens are usually rotated and can only be used once.
 */
export function refreshSession(): Promise<AuthSession> {
    refreshing ??= api
        .post<ApiSuccess<AuthSession>>('/auth/refresh')
        .then((response) => {
            tokenStore.set(response.data.data.accessToken)
            return response.data.data
        })
        .finally(() => {
            refreshing = null
        })
    return refreshing
}

// ---------------------------------------------------------------- interceptors

api.interceptors.request.use((config) => {
    const token = tokenStore.get()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

/** Login, refresh and logout answer 401 for reasons a token refresh cannot fix. */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout']

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined
        const canRefresh =
            error.response?.status === 401 &&
            original !== undefined &&
            !original._retried &&
            !NO_REFRESH_PATHS.some((path) => original.url?.startsWith(path))

        if (canRefresh) {
            // Retry once. A second 401 after a fresh token means the user truly has no access.
            original._retried = true
            try {
                await refreshSession()
            } catch {
                tokenStore.clear()
                onSessionExpired?.()
                throw toApiError(error)
            }
            return api(original)
        }

        throw toApiError(error)
    },
)