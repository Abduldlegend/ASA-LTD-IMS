import { api, refreshSession, type AuthSession } from '@/lib/api'
import { tokenStore } from '@/lib/tokenStore'
import type { ApiSuccess } from '@/types/api'
import type { ChangePasswordValues, LoginValues } from './schemas'

export async function login(values: LoginValues): Promise<AuthSession> {
    const response = await api.post<ApiSuccess<AuthSession>>('/auth/login', values)
    tokenStore.set(response.data.data.accessToken)
    return response.data.data
}

/** Called on page load: if the refresh cookie is still valid, the user is signed back in. */
export function restoreSession(): Promise<AuthSession> {
    return refreshSession()
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout')
    } finally {
        tokenStore.clear()
    }
}

export async function changePassword(values: ChangePasswordValues): Promise<void> {
    await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
    })
}