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

/**
 * Adding and changing suppliers and raw materials, and the costs on them, is for management.
 * Staff can see both lists, because they receive deliveries and need to know what is in stock,
 * but they are not sent costs or amounts owed. The API must enforce this too.
 */
export function canManageProcurement(role: Role): boolean {
    return role === 'admin'
}

/**
 * Correcting stock by hand (a recount, damaged goods) changes what the business believes it owns,
 * so it is for management. Staff can see stock and the movement history. The API must enforce this too.
 */
export function canAdjustStock(role: Role): boolean {
    return role === 'admin'
}

/**
 * Staff add and edit customers, because they often have to do it in the middle of a sale. Switching a
 * customer off, and seeing what customers owe, is for management. The API must enforce this too.
 */
export function canDeactivateCustomers(role: Role): boolean {
    return role === 'admin'
}

/**
 * Anyone can record a sale and take a later payment, because that is the till. Cancelling one puts stock back
 * and rewrites what a customer owes, so it is for management, and so are the totals across all sales.
 * Staff do see the amounts on a sale they can open, since they quote them to the customer. The API must enforce this too.
 */
export function canCancelSales(role: Role): boolean {
    return role === 'admin'
}