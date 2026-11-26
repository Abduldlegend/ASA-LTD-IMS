import type { InternalAxiosRequestConfig } from 'axios'
import { subDays } from 'date-fns'
import type { Customer, CustomerType } from '@/features/customers/types'
import { isNigerianPhone, normalizePhone } from '@/lib/phone'
import { requireAdmin, requireUser } from './guards'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'
import { paginate } from './listing'

/**
 *   GET   /customers      ?page&pageSize&search&sortBy&sortOrder&type&status&balance=owing -> Paginated<Customer>
 *   POST  /customers      { name, type, contactPerson, phone, email, address, note }       -> Customer
 *   PATCH /customers/:id  (same)                                                           -> Customer
 *   POST  /customers/:id/status { active }                                                 -> Customer   (management only)
 *
 * Anyone signed in can read, add and edit: staff often have to add a customer in the middle of a sale.
 * Only management can deactivate. Staff are never sent money: `balanceOwed` is null for them, and the
 * `balance=owing` filter is ignored for them, so it cannot be used to find out who owes. A phone number can
 * belong to one customer only, however it is written. Names may repeat, because two people can share one.
 */

type Seed = [name: string, type: CustomerType, contact: string, address: string, owed: number, active: boolean]

const SEEDS: Seed[] = [
    ['Danladi Construction Ltd', 'business', 'Danladi Yakubu', 'Kawo, Kaduna', 1_850_000, true],
    ['Hajiya Maryam Abubakar', 'individual', '', 'Barnawa, Kaduna', 0, true],
    ['Kaduna Homes and Estates', 'business', 'Ngozi Eze', 'Malali, Kaduna', 640_000, true],
    ['Engr. Bala Suleiman', 'individual', '', 'Television, Kaduna', 120_000, true],
    ['Rigachikun Building Supplies', 'business', 'Ahmed Tanko', 'Rigachikun', 0, true],
    ['Mr. Peter Okafor', 'individual', '', 'Sabon Tasha, Kaduna', 0, true],
    ['Sabon Tasha Roadworks', 'business', 'Samuel Joshua', 'Sabon Tasha, Kaduna', 2_400_000, true],
    ['Aisha Garba', 'individual', '', 'Ungwan Rimi, Kaduna', 0, true],
    ['Unity Estate Developers', 'business', 'Chinedu Obi', 'Narayi, Kaduna', 0, true],
    ['Alhaji Musa Ibrahim', 'individual', '', 'Kakuri, Kaduna', 75_000, true],
    ['Barnawa Interlock Pavers', 'business', 'Yakubu Dogo', 'Barnawa, Kaduna', 310_000, true],
    ['Mrs. Grace Bitrus', 'individual', '', '', 0, true],
    ['Zaria Road Contractors', 'business', 'Auwal Sani', 'Zaria Road, Kaduna', 0, true],
    ['Kawo Church Building Committee', 'business', 'Pastor Daniel Audu', 'Kawo, Kaduna', 0, true],
    ['Fatima Lawal', 'individual', '', 'Mando, Kaduna', 0, true],
    ['Tudun Wada Block Sellers', 'business', 'Idris Mohammed', 'Tudun Wada, Kaduna', 520_000, true],
    ['Mr. John Haruna', 'individual', '', '', 0, true],
    ['Maraban Jos Traders', 'business', 'Emeka Nwosu', 'Maraban Jos', 0, true],
    ['Dr. Hadiza Usman', 'individual', '', 'Kabala, Kaduna', 0, true],
    ['Kakuri Housing Cooperative', 'business', 'Zainab Kabir', 'Kakuri, Kaduna', 900_000, true],
    ['Yusuf Danjuma', 'individual', '', 'Rigasa, Kaduna', 0, true],
    ['Ungwan Rimi Plumbing Works', 'business', 'Kabiru Ali', 'Ungwan Rimi, Kaduna', 0, false],
    ['Mr. Silas Gambo', 'individual', '', '', 0, false],
    ['Narayi Gardens Ltd', 'business', 'Rita Okoro', 'Narayi, Kaduna', 0, true],
]

type Stored = Omit<Customer, 'balanceOwed'> & { owed: number }
let customers: Stored[] = []

function seed() {
    customers = SEEDS.map(([name, type, contactPerson, address, owed, active], i) => ({
        id: `c-${i + 1}`,
        code: `CUS-${String(i + 1).padStart(3, '0')}`,
        name,
        type,
        contactPerson,
        // 08050000001, 08050000002, ...
        phone: `080500${String(i + 1).padStart(5, '0')}`,
        email: type === 'business' && i % 3 === 0 ? `office${i + 1}@example.com` : '',
        address,
        note: '',
        owed,
        active,
        createdAt: subDays(new Date(), 500 - i * 15).toISOString(),
    }))
}
seed()
onMockReset(seed)

const show = (c: Stored, canSeeMoney: boolean): Customer => {
    const { owed, ...rest } = c
    return { ...rest, balanceOwed: canSeeMoney ? owed : null }
}

function readCustomer(config: InternalAxiosRequestConfig, existingId?: string) {
    const { name, type, contactPerson, phone, email, address, note } = bodyOf(config)
    const errors: Record<string, string> = {}
    if (typeof name !== 'string' || name.trim().length < 2) errors.name = 'Enter the name'
    if (type !== 'individual' && type !== 'business') errors.type = 'Choose a type'
    if (typeof phone !== 'string' || !isNigerianPhone(phone.trim())) errors.phone = 'Enter a valid Nigerian phone number'
    else {
        const taken = customers.find((c) => c.id !== existingId && normalizePhone(c.phone) === normalizePhone(phone))
        if (taken) errors.phone = `This number already belongs to ${taken.name}`
    }
    if (typeof email === 'string' && email.trim() !== '' && !/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email address'
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })
    const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    return {
        name: (name as string).trim(),
        type: type as CustomerType,
        contactPerson: type === 'business' ? text(contactPerson) : '',
        phone: (phone as string).trim(),
        email: text(email),
        address: text(address),
        note: text(note),
    }
}

function findCustomer(config: InternalAxiosRequestConfig, id: string) {
    const customer = customers.find((c) => c.id === id)
    if (!customer) fail(config, 404, { message: 'That customer no longer exists.', code: 'NOT_FOUND' })
    return customer!
}

function listCustomers(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    const canSeeMoney = me.role === 'admin'
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = customers
        .filter(
            (c) =>
                (!search || [c.name, c.code, c.contactPerson, c.phone, c.address].some((v) => v.toLowerCase().includes(search))) &&
                (!q.type || c.type === q.type) &&
                (!q.status || (q.status === 'active') === c.active) &&
                // Only management may filter by what is owed; for staff the filter is ignored.
                (!(canSeeMoney && q.balance === 'owing') || c.owed > 0),
        )
        .map((c) => show(c, canSeeMoney))
    const sortable: (keyof Customer & string)[] = canSeeMoney ? ['name', 'code', 'balanceOwed', 'createdAt'] : ['name', 'code', 'createdAt']
    return ok(config, paginate(config, rows, sortable))
}

function createCustomer(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    const input = readCustomer(config)
    const customer: Stored = {
        id: `c-${Date.now().toString(36)}`,
        code: `CUS-${String(customers.length + 1).padStart(3, '0')}`,
        ...input,
        owed: 0,
        active: true,
        createdAt: new Date().toISOString(),
    }
    customers = [...customers, customer]
    return ok(config, show(customer, me.role === 'admin'), 201)
}

function updateCustomer(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    const me = requireUser(config)
    const customer = findCustomer(config, id)
    Object.assign(customer, readCustomer(config, id))
    return ok(config, show(customer, me.role === 'admin'))
}

function setCustomerStatus(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config, 'Only management can deactivate or reactivate customers.')
    const customer = findCustomer(config, id)
    const { active } = bodyOf(config)
    if (typeof active !== 'boolean') fail(config, 422, { message: 'Say whether the customer should be active.' })
    customer.active = active as boolean
    return ok(config, show(customer, true))
}

/** For the sales mock: who a sale can be made to, and keeping what they owe in step with sales and payments. */
export const customerForSale = (id: string) => customers.find((c) => c.id === id)
export function addToCustomerOwed(id: string, change: number) {
    const customer = customers.find((c) => c.id === id)
  if (customer) customer.owed = Math.max(0, Math.round((customer.owed + change) * 100) / 100)
}

export const customersRoutes: Route[] = [
    ['GET /customers', listCustomers],
    ['POST /customers', createCustomer],
    ['PATCH /customers/:id', updateCustomer],
    ['POST /customers/:id/status', setCustomerStatus],
]