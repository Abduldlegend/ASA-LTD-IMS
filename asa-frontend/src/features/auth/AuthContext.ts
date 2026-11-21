import { createContext, useContext } from 'react'
import type { User } from '@/types/user'
import type { LoginValues } from './schemas'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

/** Why there is no session: the user signed out on purpose, or it ran out underneath them. */
export type SessionEnd = 'signed-out' | 'expired' | null

export interface AuthContextValue {
    status: AuthStatus
    user: User | null
    sessionEnd: SessionEnd
    login: (values: LoginValues) => Promise<void>
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
    const value = useContext(AuthContext)
    if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
    return value
}