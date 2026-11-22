import type { Role } from '@/types/user'

/** A person with an account, as management sees them. */
export interface ManagedUser {
    id: string
    name: string
    email: string
    /** Optional. */
    phone: string
    role: Role
    active: boolean
    /** ISO date and time, or null if the person has never signed in. */
    lastLoginAt: string | null
    createdAt: string
}

export type UserStatus = 'active' | 'inactive'

export interface UserInput {
    name: string
    email: string
    phone: string
    role: Role
}

export interface NewUserInput extends UserInput {
    /** The first password. The person is asked to change it. */
    password: string
}