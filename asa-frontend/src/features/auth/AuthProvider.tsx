import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setSessionExpiredHandler } from '@/lib/api'
import { tokenStore } from '@/lib/tokenStore'
import type { User } from '@/types/user'
import * as authApi from './auth.api'
import { AuthContext, type AuthContextValue, type AuthStatus, type SessionEnd } from './AuthContext'

interface State {
    status: AuthStatus
    user: User | null
    sessionEnd: SessionEnd
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()
    const [state, setState] = useState<State>({ status: 'loading', user: null, sessionEnd: null })

    // Cached screens belong to whoever was signed in, so they are dropped whenever the session changes.
    const endSession = useCallback(
        (sessionEnd: SessionEnd) => {
            tokenStore.clear()
            queryClient.clear()
            setState({ status: 'unauthenticated', user: null, sessionEnd })
        },
        [queryClient],
    )

    // On page load, try to pick the session back up from the refresh cookie.
    useEffect(() => {
        let cancelled = false
        authApi
            .restoreSession()
            .then(({ user }) => {
                if (!cancelled) setState({ status: 'authenticated', user, sessionEnd: null })
            })
            .catch(() => {
                if (!cancelled) setState({ status: 'unauthenticated', user: null, sessionEnd: null })
            })
        return () => {
            cancelled = true
        }
    }, [])

    // If a request finds the session dead and cannot renew it, sign out wherever the user is.
    useEffect(() => {
        setSessionExpiredHandler(() => endSession('expired'))
        return () => setSessionExpiredHandler(null)
    }, [endSession])

    const login = useCallback<AuthContextValue['login']>(
        async (values) => {
            const { user } = await authApi.login(values)
            queryClient.clear()
            setState({ status: 'authenticated', user, sessionEnd: null })
        },
        [queryClient],
    )

    const logout = useCallback<AuthContextValue['logout']>(async () => {
        try {
            await authApi.logout()
        } catch {
            // Even if the server cannot be reached, this browser is signed out.
        }
        endSession('signed-out')
    }, [endSession])

    const value = useMemo<AuthContextValue>(() => ({ ...state, login, logout }), [state, login, logout])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}