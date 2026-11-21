export type Role = 'admin' | 'staff'

export interface User {
    id: string
    name: string
    email: string
    role: Role
}

export const ROLE_LABELS: Record<Role, string> = {
    admin: 'Management',
    staff: 'Staff',
}