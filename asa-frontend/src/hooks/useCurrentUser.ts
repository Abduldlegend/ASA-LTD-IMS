import { useAuth } from '@/features/auth/AuthContext'
import type { User } from '@/types/user'

/** The signed-in user. Only call this inside routes that sit behind <ProtectedRoute>. */
export function useCurrentUser(): User {
    const { user } = useAuth()
    if (!user) throw new Error('useCurrentUser was called while nobody is signed in')
    return user
}