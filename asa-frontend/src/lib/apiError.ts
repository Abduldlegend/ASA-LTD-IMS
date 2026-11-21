import { isAxiosError } from 'axios'
import type { ApiFailure } from '@/types/api'

/** The one error shape the rest of the app deals with. */
export class ApiError extends Error {
    readonly status: number
    readonly code?: string
    readonly fieldErrors?: Record<string, string>
    /** True when the server could not be reached at all. */
    readonly isNetworkError: boolean

    constructor(
        message: string,
        options: { status?: number; code?: string; fieldErrors?: Record<string, string>; isNetworkError?: boolean } = {},
    ) {
        super(message)
        this.name = 'ApiError'
        this.status = options.status ?? 0
        this.code = options.code
        this.fieldErrors = options.fieldErrors
        this.isNetworkError = options.isNetworkError ?? false
    }
}

const NETWORK_MESSAGE = "We can't reach the server. Check your internet connection and try again."
const TIMEOUT_MESSAGE = 'The server took too long to respond. Try again in a moment.'
const SERVER_MESSAGE = 'Something went wrong on our side. Try again in a moment.'

function isFailureBody(body: unknown): body is Partial<ApiFailure> {
    return typeof body === 'object' && body !== null
}

/** Turns anything thrown by Axios, or by our own code, into an ApiError with a message safe to show. */
export function toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error

    if (isAxiosError(error)) {
        if (!error.response) {
            const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
            return new ApiError(timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE, { isNetworkError: true })
        }
        const { status, data } = error.response
        const body = isFailureBody(data) ? data : {}
        // Server errors can carry technical details, so those are never shown to people.
        const message = status >= 500 ? SERVER_MESSAGE : typeof body.message === 'string' ? body.message : 'The request could not be completed.'
        return new ApiError(message, { status, code: body.code, fieldErrors: body.errors })
    }

    return new ApiError(error instanceof Error ? error.message : 'Something went wrong.')
}