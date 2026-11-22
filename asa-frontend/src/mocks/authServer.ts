// import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
// import type { ApiFailure } from '@/types/api'
// import type { User } from '@/types/user'

// /**
//  * A stand-in for the auth endpoints, answering exactly as the real API will:
//  *
//  *   POST /auth/login            { email, password }                -> { accessToken, user }
//  *   POST /auth/refresh          (refresh cookie)                   -> { accessToken, user }
//  *   POST /auth/logout                                              -> null
//  *   GET  /auth/me               (bearer token)                     -> user
//  *   POST /auth/change-password  { currentPassword, newPassword }   -> null
//  *
//  * Successful bodies are { success: true, data }. Failures are { success: false, message, code?, errors? }.
//  * The refresh "cookie" is kept in localStorage here; in the real API it is an HTTP-only cookie.
//  */

// interface DemoAccount extends User {
//     password: string
// }

// export const DEMO_ACCOUNTS: DemoAccount[] = [
//     { id: 'u-admin', name: 'Abdulkadir Musa', email: 'admin@asaltd.test', role: 'admin', password: 'Admin@1234' },
//     { id: 'u-staff', name: 'Aisha Bello', email: 'staff@asaltd.test', role: 'staff', password: 'Staff@1234' },
// ]

// export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
// export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
// export const MAX_LOGIN_ATTEMPTS = 5

// const REFRESH_KEY = 'asa.mock.refreshToken'

// // Passwords changed in a session last until the page is reloaded.
// const passwords = new Map<string, string>()
// const failedLogins = new Map<string, number>()
// const state = { delayMs: 400, refreshCalls: 0 }

// export const mockServer = {
//     setDelay(ms: number) {
//         state.delayMs = ms
//     },
//     /** How many times /auth/refresh has been called. Used by tests. */
//     get refreshCalls() {
//         return state.refreshCalls
//     },
//     /** Clears everything the mock remembers. Used by tests. */
//     reset() {
//         passwords.clear()
//         failedLogins.clear()
//         state.refreshCalls = 0
//         storage.remove()
//     },
//     /** Creates an access token that is already expired. Used by tests. */
//     expiredAccessToken(userId: string) {
//         return `mock.${userId}.${Date.now() - 1000}`
//     },
// }

// const storage = {
//     read(): { userId: string; expiresAt: number } | null {
//         try {
//             const raw = localStorage.getItem(REFRESH_KEY)
//             return raw ? (JSON.parse(raw) as { userId: string; expiresAt: number }) : null
//         } catch {
//             return null
//         }
//     },
//     write(userId: string) {
//         try {
//             localStorage.setItem(REFRESH_KEY, JSON.stringify({ userId, expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS }))
//         } catch {
//             /* storage can be blocked; the session then simply ends on reload */
//         }
//     },
//     remove() {
//         try {
//             localStorage.removeItem(REFRESH_KEY)
//         } catch {
//             /* nothing to remove */
//         }
//     },
// }

// function toUser({ password: _password, ...user }: DemoAccount): User {
//     return user
// }

// const findById = (id: string) => DEMO_ACCOUNTS.find((a) => a.id === id)
// const passwordFor = (account: DemoAccount) => passwords.get(account.id) ?? account.password

// function issueAccessToken(userId: string) {
//     return `mock.${userId}.${Date.now() + ACCESS_TOKEN_TTL_MS}`
// }

// function userFromBearer(config: InternalAxiosRequestConfig): DemoAccount | null {
//     const header = String(config.headers.get('Authorization') ?? '')
//     const [scheme, token] = header.split(' ')
//     if (scheme !== 'Bearer' || !token) return null
//     const [prefix, userId, expiresAt] = token.split('.')
//     if (prefix !== 'mock' || Number(expiresAt) < Date.now()) return null
//     return findById(userId) ?? null
// }

// function respond<T>(config: InternalAxiosRequestConfig, status: number, body: unknown): AxiosResponse<T> {
//     return { data: body as T, status, statusText: String(status), headers: new AxiosHeaders(), config }
// }

// const ok = (config: InternalAxiosRequestConfig, data: unknown) => respond(config, 200, { success: true, data })

// function fail(config: InternalAxiosRequestConfig, status: number, body: Omit<ApiFailure, 'success'>): never {
//     const response = respond(config, status, { success: false, ...body })
//     throw new AxiosError(body.message, status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, null, response)
// }

// const unauthorized = (config: InternalAxiosRequestConfig) =>
//     fail(config, 401, { message: 'Your session has ended. Sign in again.', code: 'UNAUTHORIZED' })

// function bodyOf(config: InternalAxiosRequestConfig): Record<string, unknown> {
//     try {
//         const raw = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
//         return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
//     } catch {
//         return {}
//     }
// }

// function session(account: DemoAccount) {
//     return { accessToken: issueAccessToken(account.id), user: toUser(account) }
// }

// function login(config: InternalAxiosRequestConfig) {
//     const { email, password } = bodyOf(config)
//     if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
//         fail(config, 422, {
//             message: 'Enter your email address and password.',
//             errors: {
//                 ...(!email && { email: 'Enter your email address' }),
//                 ...(!password && { password: 'Enter your password' }),
//             },
//         })
//     }

//     const key = (email as string).trim().toLowerCase()
//     if ((failedLogins.get(key) ?? 0) >= MAX_LOGIN_ATTEMPTS) {
//         fail(config, 429, { message: 'Too many sign-in attempts. Try again in 15 minutes.', code: 'TOO_MANY_ATTEMPTS' })
//     }

//     const account = DEMO_ACCOUNTS.find((a) => a.email === key)
//     if (!account || passwordFor(account) !== password) {
//         failedLogins.set(key, (failedLogins.get(key) ?? 0) + 1)
//         // The same message for an unknown email and a wrong password, so neither can be guessed.
//         fail(config, 401, { message: 'The email or password is incorrect.', code: 'INVALID_CREDENTIALS' })
//     }

//     failedLogins.delete(key)
//     storage.write(account!.id)
//     return ok(config, session(account!))
// }

// function refresh(config: InternalAxiosRequestConfig) {
//     state.refreshCalls += 1
//     const cookie = storage.read()
//     const account = cookie && cookie.expiresAt > Date.now() ? findById(cookie.userId) : undefined
//     if (!account) {
//         storage.remove()
//         unauthorized(config)
//     }
//     // Refresh tokens are rotated on every use.
//     storage.write(account!.id)
//     return ok(config, session(account!))
// }

// function changePassword(config: InternalAxiosRequestConfig) {
//     const account = userFromBearer(config)
//     if (!account) unauthorized(config)

//     const { currentPassword, newPassword } = bodyOf(config)
//     if (typeof currentPassword !== 'string' || passwordFor(account!) !== currentPassword) {
//         fail(config, 422, {
//             message: 'Check the highlighted fields.',
//             errors: { currentPassword: 'Your current password is incorrect' },
//         })
//     }
//     if (typeof newPassword !== 'string' || newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
//         fail(config, 422, {
//             message: 'Check the highlighted fields.',
//             errors: { newPassword: 'Use at least 8 characters, with a letter and a number' },
//         })
//     }

//     passwords.set(account!.id, newPassword as string)
//     return ok(config, null)
// }

// /** Plugs into Axios as its adapter, so interceptors, headers and errors behave as they will for real. */
// export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
//     if (state.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, state.delayMs))

//     const route = `${(config.method ?? 'get').toUpperCase()} ${config.url}`
//     switch (route) {
//         case 'POST /auth/login':
//             return login(config)
//         case 'POST /auth/refresh':
//             return refresh(config)
//         case 'POST /auth/logout':
//             storage.remove()
//             return ok(config, null)
//         case 'GET /auth/me': {
//             const account = userFromBearer(config)
//             if (!account) unauthorized(config)
//             return ok(config, toUser(account!))
//         }
//         case 'POST /auth/change-password':
//             return changePassword(config)
//         default:
//             return fail(config, 404, { message: `The mock API has no endpoint for ${route}.`, code: 'NOT_FOUND' })
//     }
// }

import type { InternalAxiosRequestConfig } from 'axios'
import type { User } from '@/types/user'
import { bodyOf, fail, network, ok, onMockReset, resetMocks, type Route } from './http'

/**
 * A stand-in for the auth endpoints, answering exactly as the real API will:
 *
 *   POST /auth/login            { email, password }                -> { accessToken, user }
 *   POST /auth/refresh          (refresh cookie)                   -> { accessToken, user }
 *   POST /auth/logout                                              -> null
 *   GET  /auth/me               (bearer token)                     -> user
 *   POST /auth/change-password  { currentPassword, newPassword }   -> null
 *
 * Routes are served by mockApi.ts. Successful bodies are { success: true, data }. Failures are { success: false, message, code?, errors? }.
 * The refresh "cookie" is kept in localStorage here; in the real API it is an HTTP-only cookie.
 */

interface DemoAccount extends User {
    password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
    { id: 'u-admin', name: 'Abdulkadir Musa', email: 'admin@asaltd.test', role: 'admin', password: 'Admin@1234' },
    { id: 'u-staff', name: 'Aisha Bello', email: 'staff@asaltd.test', role: 'staff', password: 'Staff@1234' },
]

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const MAX_LOGIN_ATTEMPTS = 5

const REFRESH_KEY = 'asa.mock.refreshToken'

// Passwords changed in a session last until the page is reloaded.
const passwords = new Map<string, string>()
const failedLogins = new Map<string, number>()
const state = { refreshCalls: 0 }

export const mockServer = {
    setDelay(ms: number) {
        network.delayMs = ms
    },
    /** How many times /auth/refresh has been called. Used by tests. */
    get refreshCalls() {
        return state.refreshCalls
    },
    /** Clears everything the mocks remember, including the other mock modules. Used by tests. */
    reset: resetMocks,
    /** Creates an access token that is already expired. Used by tests. */
    expiredAccessToken(userId: string) {
        return `mock.${userId}.${Date.now() - 1000}`
    },
}

onMockReset(() => {
    passwords.clear()
    failedLogins.clear()
    state.refreshCalls = 0
    storage.remove()
})

const storage = {
    read(): { userId: string; expiresAt: number } | null {
        try {
            const raw = localStorage.getItem(REFRESH_KEY)
            return raw ? (JSON.parse(raw) as { userId: string; expiresAt: number }) : null
        } catch {
            return null
        }
    },
    write(userId: string) {
        try {
            localStorage.setItem(REFRESH_KEY, JSON.stringify({ userId, expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS }))
        } catch {
            /* storage can be blocked; the session then simply ends on reload */
        }
    },
    remove() {
        try {
            localStorage.removeItem(REFRESH_KEY)
        } catch {
            /* nothing to remove */
        }
    },
}

function toUser({ password: _password, ...user }: DemoAccount): User {
    return user
}

const findById = (id: string) => DEMO_ACCOUNTS.find((a) => a.id === id)
const passwordFor = (account: DemoAccount) => passwords.get(account.id) ?? account.password

function issueAccessToken(userId: string) {
    return `mock.${userId}.${Date.now() + ACCESS_TOKEN_TTL_MS}`
}

export function userFromBearer(config: InternalAxiosRequestConfig): DemoAccount | null {
    const header = String(config.headers.get('Authorization') ?? '')
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) return null
    const [prefix, userId, expiresAt] = token.split('.')
    if (prefix !== 'mock' || Number(expiresAt) < Date.now()) return null
    return findById(userId) ?? null
}

export const unauthorized = (config: InternalAxiosRequestConfig) =>
    fail(config, 401, { message: 'Your session has ended. Sign in again.', code: 'UNAUTHORIZED' })

function session(account: DemoAccount) {
    return { accessToken: issueAccessToken(account.id), user: toUser(account) }
}

function login(config: InternalAxiosRequestConfig) {
    const { email, password } = bodyOf(config)
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        fail(config, 422, {
            message: 'Enter your email address and password.',
            errors: {
                ...(!email && { email: 'Enter your email address' }),
                ...(!password && { password: 'Enter your password' }),
            },
        })
    }

    const key = (email as string).trim().toLowerCase()
    if ((failedLogins.get(key) ?? 0) >= MAX_LOGIN_ATTEMPTS) {
        fail(config, 429, { message: 'Too many sign-in attempts. Try again in 15 minutes.', code: 'TOO_MANY_ATTEMPTS' })
    }

    const account = DEMO_ACCOUNTS.find((a) => a.email === key)
    if (!account || passwordFor(account) !== password) {
        failedLogins.set(key, (failedLogins.get(key) ?? 0) + 1)
        // The same message for an unknown email and a wrong password, so neither can be guessed.
        fail(config, 401, { message: 'The email or password is incorrect.', code: 'INVALID_CREDENTIALS' })
    }

    failedLogins.delete(key)
    storage.write(account!.id)
    return ok(config, session(account!))
}

function refresh(config: InternalAxiosRequestConfig) {
    state.refreshCalls += 1
    const cookie = storage.read()
    const account = cookie && cookie.expiresAt > Date.now() ? findById(cookie.userId) : undefined
    if (!account) {
        storage.remove()
        unauthorized(config)
    }
    // Refresh tokens are rotated on every use.
    storage.write(account!.id)
    return ok(config, session(account!))
}

function changePassword(config: InternalAxiosRequestConfig) {
    const account = userFromBearer(config)
    if (!account) unauthorized(config)

    const { currentPassword, newPassword } = bodyOf(config)
    if (typeof currentPassword !== 'string' || passwordFor(account!) !== currentPassword) {
        fail(config, 422, {
            message: 'Check the highlighted fields.',
            errors: { currentPassword: 'Your current password is incorrect' },
        })
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        fail(config, 422, {
            message: 'Check the highlighted fields.',
            errors: { newPassword: 'Use at least 8 characters, with a letter and a number' },
        })
    }

    passwords.set(account!.id, newPassword as string)
    return ok(config, null)
}

export const authRoutes: Route[] = [
    ['POST /auth/login', login],
    ['POST /auth/refresh', refresh],
    [
        'POST /auth/logout',
        (config) => {
            storage.remove()
            return ok(config, null)
        },
    ],
    [
        'GET /auth/me',
        (config) => {
            const account = userFromBearer(config)
            if (!account) unauthorized(config)
            return ok(config, toUser(account!))
        },
    ],
    ['POST /auth/change-password', changePassword],
]