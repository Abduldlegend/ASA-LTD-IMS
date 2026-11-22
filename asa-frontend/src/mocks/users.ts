import type { InternalAxiosRequestConfig } from 'axios'
import { addDays, subDays, subHours } from 'date-fns'
import type { ManagedUser } from '@/features/users/types'
import type { Paginated } from '@/types/api'
import type { Role } from '@/types/user'
import { DEMO_ACCOUNTS, unauthorized, userFromBearer } from './authServer'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'

/**
 *   GET   /users                 ?page&pageSize&search&sortBy&sortOrder&role&status  -> Paginated<ManagedUser>
 *   POST  /users                 { name, email, phone, role, password }              -> ManagedUser
 *   PATCH /users/:id             { name, email, phone, role }                        -> ManagedUser
 *   POST  /users/:id/status      { active }                                          -> ManagedUser
 *
 * Management only: staff get 403. A real server must also refuse to deactivate or demote the last active admin.
 */

const NAMES: [string, Role][] = [
    ['Ibrahim Danjuma', 'staff'], ['Fatima Yusuf', 'staff'], ['Chinedu Okafor', 'staff'], ['Hauwa Garba', 'staff'],
    ['Emeka Nwosu', 'staff'], ['Zainab Abubakar', 'staff'], ['Samuel Adeyemi', 'staff'], ['Maryam Sani', 'staff'],
    ['Yusuf Lawal', 'staff'], ['Blessing Eze', 'staff'], ['Musa Bello', 'staff'], ['Amina Idris', 'staff'],
    ['Tunde Bakare', 'staff'], ['Ngozi Obi', 'staff'], ['Sadiq Umar', 'staff'], ['Rukayya Aliyu', 'staff'],
    ['Joseph Danladi', 'staff'], ['Halima Mohammed', 'staff'], ['Peter Okonkwo', 'staff'], ['Salamatu Jibril', 'staff'],
    ['Abubakar Shehu', 'staff'], ['Grace Ojo', 'staff'], ['Kabiru Tanko', 'staff'], ['Deborah Audu', 'staff'],
    ['Nasir Haruna', 'staff'], ['Esther Bassey', 'staff'], ['Lawal Gambo', 'staff'], ['Hadiza Kabir', 'admin'],
    ['Aliyu Mustapha', 'staff'], ['Victoria Ikenna', 'staff'], ['Danjuma Pam', 'staff'], ['Rabi Hassan', 'staff'],
]

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '.')

function seed(): ManagedUser[] {
    const now = new Date()
    const demo: ManagedUser[] = DEMO_ACCOUNTS.map((a, i) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: i === 0 ? '0803 555 0142' : '0806 555 0187',
        role: a.role,
        active: true,
        lastLoginAt: subHours(now, i === 0 ? 1 : 5).toISOString(),
        createdAt: subDays(now, 400 - i).toISOString(),
    }))
    const others = NAMES.map(([name, role], i): ManagedUser => ({
        id: `u-${i + 1}`,
        name,
        email: `${slug(name)}@asaltd.test`,
        phone: i % 5 === 4 ? '' : `080${(i % 9) + 1} 555 ${String(1000 + i * 37).slice(-4)}`,
        role,
        // A few have left or are on hold, and a few have never signed in.
        active: i % 9 !== 7,
        lastLoginAt: i % 11 === 10 ? null : subHours(now, 3 + i * 17).toISOString(),
        createdAt: addDays(subDays(now, 380), i * 9).toISOString(),
    }))
    return [...demo, ...others]
}

let users = seed()
onMockReset(() => {
    users = seed()
})

function requireAdmin(config: InternalAxiosRequestConfig) {
    const me = userFromBearer(config)
    if (!me) unauthorized(config)
    if (me!.role !== 'admin') fail(config, 403, { message: 'Only management can manage user accounts.', code: 'FORBIDDEN' })
    return me!
}

const isEmail = (v: unknown): v is string => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const activeAdmins = () => users.filter((u) => u.role === 'admin' && u.active)

function readProfile(config: InternalAxiosRequestConfig, ignoreId?: string) {
    const { name, email, phone, role } = bodyOf(config)
    const errors: Record<string, string> = {}
    if (typeof name !== 'string' || name.trim().length < 2) errors.name = 'Enter the full name'
    if (!isEmail(email)) errors.email = 'Enter a valid email address'
    else if (users.some((u) => u.id !== ignoreId && u.email.toLowerCase() === email.trim().toLowerCase()))
        errors.email = 'Another user already has this email address'
    if (role !== 'admin' && role !== 'staff') errors.role = 'Choose a role'
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })
    return {
        name: (name as string).trim(),
        email: (email as string).trim().toLowerCase(),
        phone: typeof phone === 'string' ? phone.trim() : '',
        role: role as Role,
    }
}

function list(config: InternalAxiosRequestConfig) {
    requireAdmin(config)
    const q = queryOf(config)
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20))
    const search = (q.search ?? '').toLowerCase()

    let rows = users.filter(
        (u) =>
            (!search || [u.name, u.email, u.phone].some((v) => v.toLowerCase().includes(search))) &&
            (!q.role || u.role === q.role) &&
            (!q.status || (q.status === 'active') === u.active),
    )

    const sortBy = (['name', 'email', 'role', 'lastLoginAt', 'createdAt'] as const).find((k) => k === q.sortBy) ?? 'name'
    const direction = q.sortOrder === 'desc' ? -1 : 1
    rows = [...rows].sort((a, b) => {
        // People who never signed in sort as the oldest.
        const [x, y] = [a[sortBy] ?? '', b[sortBy] ?? '']
        return x.localeCompare(y, 'en', { sensitivity: 'base' }) * direction
    })

    const data: Paginated<ManagedUser> = {
        items: rows.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: rows.length,
    }
    return ok(config, data)
}

function create(config: InternalAxiosRequestConfig) {
    requireAdmin(config)
    const profile = readProfile(config)
    const { password } = bodyOf(config)
    if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        fail(config, 422, {
            message: 'Check the highlighted fields.',
            errors: { password: 'Use at least 8 characters, with a letter and a number' },
        })
    }
    const user: ManagedUser = {
        id: `u-${Date.now().toString(36)}`,
        ...profile,
        active: true,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
    }
    users = [user, ...users]
    return ok(config, user, 201)
}

const find = (config: InternalAxiosRequestConfig, id: string) => {
    const user = users.find((u) => u.id === id)
    if (!user) fail(config, 404, { message: 'That user no longer exists.', code: 'NOT_FOUND' })
    return user!
}

function update(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    const me = requireAdmin(config)
    const user = find(config, id)
    const profile = readProfile(config, id)
    if (profile.role !== user.role) {
        if (user.id === me.id) fail(config, 409, { message: 'You cannot change your own role.', code: 'SELF_CHANGE' })
        if (user.role === 'admin' && user.active && activeAdmins().length === 1) {
            fail(config, 409, { message: 'This is the only active management account, so it cannot become staff.', code: 'LAST_ADMIN' })
        }
    }
    Object.assign(user, profile)
    return ok(config, user)
}

function setStatus(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    const me = requireAdmin(config)
    const user = find(config, id)
    const { active } = bodyOf(config)
    if (typeof active !== 'boolean') fail(config, 422, { message: 'Say whether the account should be active.' })
    if (!active) {
        if (user.id === me.id) fail(config, 409, { message: 'You cannot deactivate your own account.', code: 'SELF_CHANGE' })
        if (user.role === 'admin' && user.active && activeAdmins().length === 1) {
            fail(config, 409, { message: 'This is the only active management account, so it cannot be deactivated.', code: 'LAST_ADMIN' })
        }
    }
    user.active = active as boolean
    return ok(config, user)
}

export const usersRoutes: Route[] = [
    ['GET /users', list],
    ['POST /users', create],
    ['PATCH /users/:id', update],
    ['POST /users/:id/status', setStatus],
]