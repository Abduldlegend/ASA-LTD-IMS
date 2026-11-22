import type { Role } from '@/types/user'

/**
 * Money figures (sales, expenses, profit, balances) are for management only.
 * This only decides what the screens show. The API must refuse to send these
 * figures to staff, because anything the browser receives can be read.
 */
export function canViewFinancials(role: Role): boolean {
    return role === 'admin'
}

/**
 * Adding and changing products, prices and categories is for management. Staff can see the catalogue,
 * since they need prices and stock to sell. Again, the API must enforce this too.
 */
export function canManageCatalog(role: Role): boolean {
    return role === 'admin'
}