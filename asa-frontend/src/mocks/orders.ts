import type { InternalAxiosRequestConfig } from 'axios'
import { addDays, format, parseISO, subDays } from 'date-fns'
import type { Order, OrderLine, OrderStatus, OrderSummary } from '@/features/orders/types'
import { lineAmount, piecesFor, round2, UNIT_BY_KIND } from '@/features/sales/units'
import { hasAtMostTwoDecimals } from '@/lib/parseNumber'
import { productSaleRows } from './catalog'
import { customerForSale } from './customers'
import { requireUser } from './guards'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'
import { paginate } from './listing'
import { makeSale } from './sales'

/**
 *   GET   /orders           ?page&pageSize&search&sortBy&sortOrder&status=pending|fulfilled|cancelled&due=overdue -> Paginated<Order>
 *   GET   /orders/summary                                          -> OrderSummary
 *   POST  /orders           { customerId, neededBy, lines: [{ productId, quantity }], note } -> Order
 *   PATCH /orders/:id       (same; open orders only)               -> Order
 *   POST  /orders/:id/cancel                                       -> Order
 *   POST  /orders/:id/fulfil  (a sale: { soldOn, lines, payment, note }) -> Sale
 *
 * An order is a promise, not a sale: it does not touch stock or what a customer owes. Fulfilling it records a
 * sale for the order's own customer through the same code as a sale at the till, so stock, prices and credit rules
 * are the same, and the order is only marked fulfilled if that sale went through. Anyone signed in can do all of this.
 */

const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const today = () => iso(new Date())
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISO(v).getTime())

let orders: Order[] = []

type Seed = [orderedAgo: number, neededIn: number, customerId: string, lines: [product: string, quantity: number][], status: OrderStatus, saleCode?: string, note?: string]

/** Oldest first, so the numbers run ORD-0001 upwards. A negative `neededIn` is a date in the past. */
const SEEDS: Seed[] = [
    [20, -12, 'c-1', [['Hollow block 5 inch', 300]], 'fulfilled', 'SAL-0012'],
    [16, -8, 'c-20', [['Double T interlock', 60]], 'fulfilled', 'SAL-0011'],
    [12, -6, 'c-16', [['Solid block 6 inch', 100]], 'cancelled'],
    [6, -2, 'c-3', [['Hollow block 9 inch', 500]], 'pending', undefined, 'Deliver to the Malali site'],
    [5, 3, 'c-1', [['Hollow block 6 inch', 200], ['Dangote 3X cement 50kg', 30]], 'pending'],
    [4, 0, 'c-2', [['Double T interlock', 50]], 'pending'],
    // Far more than is in stock, so fulfilling it shows what happens when stock is short.
    [3, 10, 'c-7', [['I-Shape interlock', 300]], 'pending', undefined, 'Roadworks phase two'],
    [2, 5, 'c-11', [['Double T interlock', 80]], 'pending'],
    [1, 7, 'c-10', [['BUA cement 50kg', 40]], 'pending'],
]

function price(lines: { productId: string; quantity: number }[]) {
    const rows = productSaleRows()
    const items: OrderLine[] = lines.map(({ productId, quantity }) => {
        const p = rows.find((r) => r.id === productId)!
        return { productId, productName: p.name, kind: p.kind, unit: UNIT_BY_KIND[p.kind], quantity, unitPrice: p.price, lineTotal: lineAmount(p.price, quantity) }
    })
    return { items, total: round2(items.reduce((n, l) => n + l.lineTotal, 0)) }
}

function seed() {
    const rows = productSaleRows()
    orders = SEEDS.map(([orderedAgo, neededIn, customerId, lines, status, saleCode, note], i) => {
        const { items, total } = price(lines.map(([name, quantity]) => ({ productId: rows.find((p) => p.name === name)!.id, quantity })))
        const orderedOn = iso(subDays(new Date(), orderedAgo))
        return {
            id: `o-${i + 1}`,
            code: `ORD-${String(i + 1).padStart(4, '0')}`,
            orderedOn,
            neededBy: iso(addDays(new Date(), neededIn)),
            customerId,
            customerName: customerForSale(customerId)?.name ?? 'Customer',
            lines: items,
            estimatedTotal: total,
            status,
            note: note ?? '',
            recordedBy: i % 2 ? 'Abdulkadir Musa' : 'Aisha Bello',
            saleCode: saleCode ?? null,
            cancelledOn: status === 'cancelled' ? orderedOn : null,
            createdAt: `${orderedOn}T08:00:00.000Z`,
        }
    })
}
seed()
onMockReset(seed)

function findOrder(config: InternalAxiosRequestConfig, id: string) {
    const order = orders.find((o) => o.id === id)
    if (!order) fail(config, 404, { message: 'That order no longer exists.', code: 'NOT_FOUND' })
    return order!
}

function openOrder(config: InternalAxiosRequestConfig, id: string) {
    const order = findOrder(config, id)
    if (order.status !== 'pending') fail(config, 409, { message: `${order.code} is already ${order.status}.`, code: 'ORDER_CLOSED' })
    return order
}

function readOrder(config: InternalAxiosRequestConfig) {
    const { customerId, neededBy, lines, note } = bodyOf(config)
    const errors: Record<string, string> = {}
    const customer = typeof customerId === 'string' ? customerForSale(customerId) : undefined
    if (!customer || !customer.active) errors.customerId = 'Choose a customer who is still active'
    if (!isDate(neededBy)) errors.neededBy = 'Choose the date'
    else if (neededBy < today()) errors.neededBy = 'The date cannot be in the past'

    const catalog = productSaleRows()
    const picked: { productId: string; quantity: number }[] = []
    const rows = Array.isArray(lines) ? (lines as { productId?: unknown; quantity?: unknown }[]) : []
    if (rows.length === 0) errors.lines = 'Add at least one item'
    for (const row of rows) {
        const product = catalog.find((p) => p.id === row.productId)
        const quantity = row.quantity
        if (!product || !product.active) errors.lines = 'One of the products is not available'
        else if (typeof quantity !== 'number' || !(quantity > 0)) errors.lines = `Check the quantity of ${product.name}`
        else if (product.kind === 'interlock' ? !hasAtMostTwoDecimals(quantity) : !Number.isInteger(quantity)) errors.lines = `Check the quantity of ${product.name}`
        else if (picked.some((l) => l.productId === product.id)) errors.lines = `${product.name} is listed twice`
        else if (piecesFor(product, quantity) === null) errors.lines = `${product.name} has no pieces-per-m² rate yet, so it cannot be sold`
        else picked.push({ productId: product.id, quantity })
        if (errors.lines) break
    }
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })
    const { items, total } = price(picked)
    return { customer: customer!, neededBy: neededBy as string, items, total, note: typeof note === 'string' ? note.trim() : '' }
}

function listOrders(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = [...orders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter(
            (o) =>
                (!search || [o.code, o.customerName, ...o.lines.map((l) => l.productName)].some((v) => v.toLowerCase().includes(search))) &&
                (!q.status || o.status === q.status) &&
                (q.due !== 'overdue' || (o.status === 'pending' && o.neededBy < today())),
        )
    return ok(config, paginate(config, rows, ['orderedOn', 'neededBy', 'code', 'customerName', 'estimatedTotal']))
}

function summary(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const open = orders.filter((o) => o.status === 'pending')
    const data: OrderSummary = { open: open.length, overdue: open.filter((o) => o.neededBy < today()).length, dueToday: open.filter((o) => o.neededBy === today()).length }
    return ok(config, data)
}

function createOrder(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    const input = readOrder(config)
    const order: Order = {
        id: `o-${orders.length + 1}`,
        code: `ORD-${String(orders.length + 1).padStart(4, '0')}`,
        orderedOn: today(),
        neededBy: input.neededBy,
        customerId: input.customer.id,
        customerName: input.customer.name,
        lines: input.items,
        estimatedTotal: input.total,
        status: 'pending',
        note: input.note,
        recordedBy: me.name,
        saleCode: null,
        cancelledOn: null,
        createdAt: new Date().toISOString(),
    }
    orders = [...orders, order]
    return ok(config, order, 201)
}

function updateOrder(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireUser(config)
    const order = openOrder(config, id)
    const input = readOrder(config)
    Object.assign(order, { neededBy: input.neededBy, customerId: input.customer.id, customerName: input.customer.name, lines: input.items, estimatedTotal: input.total, note: input.note })
    return ok(config, order)
}

function cancelOrder(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireUser(config)
    const order = openOrder(config, id)
    order.status = 'cancelled'
    order.cancelledOn = today()
    return ok(config, order)
}

function fulfilOrder(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    const me = requireUser(config)
    const order = openOrder(config, id)
    // The sale is for the order's own customer, whatever the browser sent. If it fails, the order stays open.
    const sale = makeSale(config, me, { ...bodyOf(config), customerId: order.customerId })
    order.status = 'fulfilled'
    order.saleCode = sale.code
    return ok(config, sale, 201)
}

export const ordersRoutes: Route[] = [
    ['GET /orders', listOrders],
    ['GET /orders/summary', summary],
    ['POST /orders', createOrder],
    ['PATCH /orders/:id', updateOrder],
    ['POST /orders/:id/cancel', cancelOrder],
    ['POST /orders/:id/fulfil', fulfilOrder],
]