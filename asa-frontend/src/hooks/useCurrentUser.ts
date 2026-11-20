import type { User } from '@/types/user'

/**
 * Temporary stand-in until the auth context is built in Stage F1.
 * Change `role` to 'staff' to preview the staff navigation.
 */
const mockUser: User = { id: 'u1', name: 'Abdulkadir Musa', role: 'admin' }

export function useCurrentUser(): User {
    return mockUser
}