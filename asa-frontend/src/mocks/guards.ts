import type { InternalAxiosRequestConfig } from 'axios'
import { unauthorized, userFromBearer } from './authServer'
import { fail } from './http'

export function requireUser(config: InternalAxiosRequestConfig) {
    const me = userFromBearer(config)
    if (!me) unauthorized(config)
    return me!
}

export function requireAdmin(config: InternalAxiosRequestConfig, message: string) {
    const me = requireUser(config)
    if (me.role !== 'admin') fail(config, 403, { message, code: 'FORBIDDEN' })
    return me
}