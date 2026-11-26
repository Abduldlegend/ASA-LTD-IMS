import type { InternalAxiosRequestConfig } from 'axios'
import { format, parseISO, subDays } from 'date-fns'
import type { PaymentMethod, Sale, SaleLine, SalesSummary } from '@/features/sales/types'
import { describeStock, lineAmount, METHODS, paymentStatusOf, piecesFor, round2, UNIT_BY_KIND } from '@/features/sales/units'
import { formatNaira } from '@/lib/format'
import { hasAtMostTwoDecimals } from '@/lib/parseNumber'
import { productSaleRows } from './catalog'
import { addToCustomerOwed, customerForSale } from './customers'
import { requireAdmin, requireUser } from './guards'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'
import { applyStockChange } from './inventory'
import { paginate } from './listing'

/**
 *   GET  /sales            ?page&pageSize&search&sortBy&sortOrder&payment=paid|partial|unpaid&status=completed|cancelled -> Paginated<Sale>
 *   GET  /sales/summary                                                   -> SalesSummary   (management only)
 *   POST /sales            { soldOn, customerId|null, lines: [{ productId, quantity }], payment: { amount, method } | null, note } -> Sale
 *   POST /sales/:id/payments { amount, method, note }                     -> Sale
 *   POST /sales/:id/cancel                                                -> Sale           (management only)
 *
 * The server takes prices from the catalogue; the browser never sends one. A sale takes its pieces out of stock
 * straight away (interlock m² become whole pieces, rounded up) through the stock ledger in ./inventory, and what
 * is not paid now is added to what the customer owes. Walk-in customers must pay in full. Cancelling puts the
 * pieces back and clears the balance. The real system will make "when stock leaves" a setting (sale, dispatch or delivery).
 */

const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const today = () => iso(new Date())
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISO(v).getTime())

let sales: Sale[] = []
let paymentCount = 0

// ---------------------------------------------------------------- seed data

type Seed = [daysAgo: number, customerId: string | null, lines: [product: string, quantity: number][], paid: number | 'full', method: PaymentMethod, cancelled?: true]

/** Oldest first, so the numbers run SAL-0001 upwards. Their stock effects are already in the stock figures. */
const SEEDS: Seed[] = [
    [28, null, [['Hollow block 6 inch', 200]], 'full', 'cash'],
    [25, 'c-1', [['Double T interlock', 120], ['Dangote 3X cement 50kg', 20]], 600_000, 'transfer'],
    [22, 'c-7', [['I-Shape interlock', 200]], 800_000, 'transfer'],
    [20, 'c-2', [['Hollow block 9 inch', 150]], 'full', 'pos'],
    [17, null, [['Elephant cement 50kg', 10]], 'full', 'cash'],
    [14, 'c-3', [['Hollow block 6 inch', 800], ['Solid block 6 inch', 300]], 300_000, 'transfer'],
    [12, 'c-4', [['Double T interlock', 10]], 'full', 'transfer'],
    [9, 'c-16', [['Solid block 6 inch', 500], ['BUA cement 50kg', 15]], 0, 'cash'],
    [8, 'c-10', [['Hollow block 9 inch', 100]], 0, 'cash', true],
    [6, null, [['Dangote 3X cement 50kg', 8]], 'full', 'pos'],
    [4, 'c-20', [['Double T interlock', 60]], 200_000, 'transfer'],
    [2, 'c-1', [['Hollow block 5 inch', 300]], 'full', 'transfer'],
    [1, null, [['I-Shape interlock', 25], ['Hollow block 6 inch', 100]], 'full', 'cash'],
]

const lineOf = (product: ReturnType<typeof productSaleRows>[number], quantity: number): SaleLine => ({
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    kind: product.kind,
    unit: UNIT_BY_KIND[product.kind],
    quantity,
    unitPrice: product.price,
    pieces: piecesFor(product, quantity) ?? quantity,
    piecesPerSquareMetre: product.piecesPerSquareMetre,
    lineTotal: lineAmount(product.price, quantity),
})

function build(fields: Pick<Sale, 'code' | 'soldOn' | 'customerId' | 'lines' | 'note' | 'recordedBy'>, payment: { amount: number; method: PaymentMethod } | null): Sale {
    const total = round2(fields.lines.reduce((n, l) => n + l.lineTotal, 0))
    const paid = payment?.amount ?? 0
    return {
        id: `s-${fields.code.slice(4)}`,
        ...fields,
        customerName: fields.customerId ? (customerForSale(fields.customerId)?.name ?? 'Customer') : 'Walk-in customer',
        total,
        amountPaid: paid,
        balance: round2(total - paid),
        paymentStatus: paymentStatusOf(total, paid),
        status: 'completed',
        payments: payment ? [{ id: `p-${++paymentCount}`, amount: payment.amount, method: payment.method, receivedOn: fields.soldOn, receivedBy: fields.recordedBy, note: '' }] : [],
        createdAt: `${fields.soldOn}T09:00:00.000Z`,
        cancelledOn: null,
    }
}

function seed() {
    paymentCount = 0
    const rows = productSaleRows()
    sales = SEEDS.map(([daysAgo, customerId, lines, paid, method, cancelled], i) => {
        const items = lines.map(([name, quantity]) => lineOf(rows.find((p) => p.name === name)!, quantity))
        const total = round2(items.reduce((n, l) => n + l.lineTotal, 0))
        const amount = paid === 'full' ? total : paid
        const sale = build(
            { code: `SAL-${String(i + 1).padStart(4, '0')}`, soldOn: iso(subDays(new Date(), daysAgo)), customerId, lines: items, note: '', recordedBy: i % 2 ? 'Abdulkadir Musa' : 'Aisha Bello' },
            amount > 0 ? { amount, method } : null,
        )
        if (cancelled) Object.assign(sale, { status: 'cancelled', balance: 0, cancelledOn: sale.soldOn })
        return sale
    })
}
seed()
onMockReset(seed)

// ---------------------------------------------------------------- handlers

function findSale(config: InternalAxiosRequestConfig, id: string) {
    const sale = sales.find((s) => s.id === id)
    if (!sale) fail(config, 404, { message: 'That sale no longer exists.', code: 'NOT_FOUND' })
    return sale!
}

function listSales(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = [...sales]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter(
            (s) =>
                (!search || [s.code, s.customerName, ...s.lines.map((l) => l.productName)].some((v) => v.toLowerCase().includes(search))) &&
                (!q.status || s.status === q.status) &&
                (!q.payment || (s.status === 'completed' && s.paymentStatus === q.payment)) &&
                (!q.customer || s.customerId === q.customer),
        )
    return ok(config, paginate(config, rows, ['soldOn', 'code', 'total', 'customerName']))
}

function summary(config: InternalAxiosRequestConfig) {
    requireAdmin(config, 'Only management can see the totals across all sales.')
    const done = sales.filter((s) => s.status === 'completed')
    const day = today()
    const sum = (list: Sale[]) => round2(list.reduce((n, s) => n + s.total, 0))
    const data: SalesSummary = {
        soldToday: sum(done.filter((s) => s.soldOn === day)),
        salesToday: done.filter((s) => s.soldOn === day).length,
        soldThisMonth: sum(done.filter((s) => s.soldOn.startsWith(day.slice(0, 7)))),
        outstanding: round2(done.reduce((n, s) => n + s.balance, 0)),
    }
    return ok(config, data)
}

const validMethod = (v: unknown): v is PaymentMethod => METHODS.includes(v as PaymentMethod)

type Me = ReturnType<typeof requireUser>

export function makeSale(config: InternalAxiosRequestConfig, me: Me, body: Record<string, unknown> = bodyOf(config)): Sale {
    const { soldOn, customerId, lines, payment, note } = body
    // ... the rest of the old createSale body is unchanged, except it now ends with:
    const errors: Record<string, string> = {}

    if (!isDate(soldOn)) errors.soldOn = 'Choose the date'
    else if (soldOn > today()) errors.soldOn = 'The date cannot be in the future'

    if (customerId !== null && customerId !== undefined) {
        const customer = typeof customerId === 'string' ? customerForSale(customerId) : undefined
        if (!customer || !customer.active) errors.customerId = 'Choose a customer who is still active'
    }

    const catalog = productSaleRows()
    const items: SaleLine[] = []
    const rows = Array.isArray(lines) ? (lines as { productId?: unknown; quantity?: unknown }[]) : []
    if (rows.length === 0) errors.lines = 'Add at least one item'
    for (const row of rows) {
        const product = catalog.find((p) => p.id === row.productId)
        const quantity = row.quantity
        if (!product || !product.active) errors.lines = 'One of the products is not available'
        else if (typeof quantity !== 'number' || !(quantity > 0)) errors.lines = `Check the quantity of ${product.name}`
        else if (product.kind === 'interlock' ? !hasAtMostTwoDecimals(quantity) : !Number.isInteger(quantity)) errors.lines = `Check the quantity of ${product.name}`
        else if (items.some((l) => l.productId === product.id)) errors.lines = `${product.name} is listed twice`
        else {
            const pieces = piecesFor(product, quantity)
            if (pieces === null) errors.lines = `${product.name} has no pieces-per-m² rate yet, so it cannot be sold`
            else if (pieces > product.stock) errors.lines = product.stock === 0 ? `${product.name} is out of stock` : `Only ${describeStock(product, product.stock)} of ${product.name} in stock`
            else items.push(lineOf(product, quantity))
        }
        if (errors.lines) break
    }

    const total = round2(items.reduce((n, l) => n + l.lineTotal, 0))
    const paid = payment === null || payment === undefined ? 0 : (payment as { amount?: unknown }).amount
    const method = payment === null || payment === undefined ? 'cash' : (payment as { method?: unknown }).method
    if (!errors.lines) {
        if (typeof paid !== 'number' || paid < 0 || !hasAtMostTwoDecimals(paid)) errors.amountPaid = 'Check the amount received'
        else if (paid > total) errors.amountPaid = `That is more than the total of ${formatNaira(total)}`
        else if (!customerId && paid < total) errors.amountPaid = 'A walk-in customer must pay in full. Choose a customer to sell on credit.'
        else if (paid > 0 && !validMethod(method)) errors.method = 'Choose how it was paid'
    }
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })

    const code = `SAL-${String(sales.length + 1).padStart(4, '0')}`
    for (const line of items) {
        applyStockChange(`product:${line.productId}`, -line.pieces, { type: 'sale', reference: code, detail: `Sold on ${code}`, performedBy: me.name })
    }
    const sale = build(
        { code, soldOn: soldOn as string, customerId: (customerId as string | null) || null, lines: items, note: typeof note === 'string' ? note.trim() : '', recordedBy: me.name },
        (paid as number) > 0 ? { amount: paid as number, method: method as PaymentMethod } : null,
    )
    sale.createdAt = new Date().toISOString()
    if (sale.customerId && sale.balance > 0) addToCustomerOwed(sale.customerId, sale.balance)
    sales = [...sales, sale]
    return sale
}

const createSale = (config: InternalAxiosRequestConfig) => ok(config, makeSale(config, requireUser(config)), 201)

function addPayment(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    const me = requireUser(config)
    const sale = findSale(config, id)
    if (sale.status !== 'completed') fail(config, 409, { message: `${sale.code} was cancelled, so it cannot take a payment.`, code: 'SALE_CANCELLED' })
    if (sale.balance <= 0) fail(config, 409, { message: `${sale.code} is already fully paid.`, code: 'SALE_PAID' })
    const { amount, method, note } = bodyOf(config)
    const errors: Record<string, string> = {}
    if (typeof amount !== 'number' || !(amount > 0) || !hasAtMostTwoDecimals(amount)) errors.amount = 'Check the amount received'
    else if (amount > sale.balance) errors.amount = `Only ${formatNaira(sale.balance)} is still owed`
    if (!validMethod(method)) errors.method = 'Choose how it was paid'
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })

    sale.payments = [
        ...sale.payments,
        { id: `p-${++paymentCount}`, amount: amount as number, method: method as PaymentMethod, receivedOn: today(), receivedBy: me.name, note: typeof note === 'string' ? note.trim() : '' },
    ]
    sale.amountPaid = round2(sale.amountPaid + (amount as number))
    sale.balance = round2(sale.total - sale.amountPaid)
    sale.paymentStatus = paymentStatusOf(sale.total, sale.amountPaid)
    if (sale.customerId) addToCustomerOwed(sale.customerId, -(amount as number))
    return ok(config, sale)
}

function cancelSale(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    const me = requireAdmin(config, 'Only management can cancel a sale.')
    const sale = findSale(config, id)
    if (sale.status !== 'completed') fail(config, 409, { message: `${sale.code} has already been cancelled.`, code: 'SALE_CANCELLED' })
    for (const line of sale.lines) {
        applyStockChange(`product:${line.productId}`, line.pieces, { type: 'sale', reference: sale.code, detail: `Sale ${sale.code} cancelled`, performedBy: me.name })
    }
    if (sale.customerId && sale.balance > 0) addToCustomerOwed(sale.customerId, -sale.balance)
    sale.status = 'cancelled'
    sale.balance = 0
    sale.cancelledOn = today()
    return ok(config, sale)
}

export const salesRoutes: Route[] = [
    ['GET /sales', listSales],
    ['GET /sales/summary', summary],
    ['POST /sales', createSale],
    ['POST /sales/:id/payments', addPayment],
    ['POST /sales/:id/cancel', cancelSale],
]