import type { InternalAxiosRequestConfig } from 'axios'
import { subDays, subHours } from 'date-fns'
import type { AdjustmentReason, MovementType, StockGroup, StockItem, StockMovement, StockSummary } from '@/features/inventory/types'
import { quantityText, REASON_LABELS, REASONS_BY_DIRECTION, round2 } from '@/features/inventory/units'
import type { Unit } from '@/lib/format'
import { hasAtMostTwoDecimals } from '@/lib/parseNumber'
import { productStockRows, setProductStock } from './catalog'
import { requireAdmin, requireUser } from './guards'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'
import { paginate } from './listing'
import { materialStockRows, setMaterialStock } from './procurement'

/**
 *   GET  /inventory/items        ?page&pageSize&search&sortBy&sortOrder&group&stock=low -> Paginated<StockItem>
 *   GET  /inventory/summary                                                             -> { items, low, out }
 *   GET  /inventory/movements    ?page&pageSize&search&sortBy&sortOrder&type&group&item -> Paginated<StockMovement>
 *   POST /inventory/adjustments  { itemId, direction, quantity, reason, note }          -> StockMovement
 *
 * Anyone signed in can read; only management can adjust. Stock itself lives with the products and the raw
 * materials. This module reads it, and every change leaves a movement behind, so the history always adds up.
 */

const DENIED = 'Only management can adjust stock.'

// ---------------------------------------------------------------- the items

function allItems(): StockItem[] {
    const products: StockItem[] = productStockRows().map((p) => ({
        id: `product:${p.id}`,
        code: p.code,
        name: p.name,
        group: p.kind,
        unit: p.kind === 'cement' ? 'bags' : 'pcs',
        stock: p.stock,
        reorderLevel: p.reorderLevel,
        piecesPerSquareMetre: p.piecesPerSquareMetre,
        active: p.active,
    }))
    const materials: StockItem[] = materialStockRows().map((m) => ({
        id: `material:${m.id}`,
        code: m.code,
        name: m.name,
        group: 'material',
        unit: m.unit,
        stock: m.stock,
        reorderLevel: m.reorderLevel,
        piecesPerSquareMetre: null,
        active: m.active,
    }))
    return [...products, ...materials]
}

const isOut = (i: StockItem) => i.stock <= 0
const isLow = (i: StockItem) => !isOut(i) && i.reorderLevel > 0 && i.stock <= i.reorderLevel

function setStock(itemId: string, stock: number) {
    const [kind, id] = itemId.split(':')
    if (kind === 'product') setProductStock(id, stock)
    else setMaterialStock(id, stock)
}

// ---------------------------------------------------------------- the history

let movements: StockMovement[] = []
let counter = 0
const referenceCounters: Record<string, number> = {}

function reference(prefix: string) {
    referenceCounters[prefix] = (referenceCounters[prefix] ?? 1000) + 1
    return `${prefix}-${String(referenceCounters[prefix]).padStart(4, '0')}`
}

const movementOf = (item: StockItem, fields: Pick<StockMovement, 'type' | 'quantity' | 'balanceAfter' | 'reference' | 'detail' | 'performedBy' | 'createdAt'>): StockMovement => ({
    id: `mv-${++counter}`,
    itemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    group: item.group as StockGroup,
    unit: item.unit as Unit,
    piecesPerSquareMetre: item.piecesPerSquareMetre,
    ...fields,
})

/**
 * Builds a believable history that ends exactly at each item's current stock:
 * an opening balance, then two additions and two removals over the last month.
 */
function seed() {
    movements = []
    counter = 0
    for (const key of Object.keys(referenceCounters)) delete referenceCounters[key]
    const now = new Date()
    const round = (n: number, unit: Unit) => (unit === 'trips' ? round2(n) : Math.round(n))

    allItems().forEach((item, j) => {
        const { stock, unit } = item
        const isMaterial = item.group === 'material'
        // Blocks and interlocks are made here; cement is bought and resold; materials are bought and used up.
        const add: [MovementType, string, string] = isMaterial || item.group === 'cement' ? ['purchase', 'PUR', 'Delivery received'] : ['production', 'PRD', 'Production batch']
        const take: [MovementType, string, string] = isMaterial ? ['usage', 'PRD', 'Used in production'] : ['sale', 'SAL', 'Sold to customer']

        let [a, b, c, d] = [0.4, 0.3, 0.35, 0.2].map((f) => round(stock * f, unit))
        let opening = round2(stock - (a - b + c - d))
        if (stock === 0) [opening, a, b, c, d] = [200, 0, 200, 0, 0]
        else if (opening < 0) [opening, a, b, c, d] = [stock, 0, 0, 0, 0]

        const steps: [MovementType | null, string, string, number][] = [
            ['opening', '', 'Opening balance', opening],
            [add[0], add[1], add[2], a],
            [take[0], take[1], take[2], -b],
            [add[0], add[1], add[2], c],
            [take[0], take[1], take[2], -d],
        ]
        let balance = 0
        steps.forEach(([type, prefix, detail, quantity], i) => {
            if (!type || quantity === 0) return
            balance = round2(balance + quantity)
            movements.push(
                movementOf(item, {
                    type,
                    quantity,
                    balanceAfter: balance,
                    reference: prefix ? reference(prefix) : null,
                    detail,
                    performedBy: 'Aisha Bello',
                    createdAt: subHours(subDays(now, (4 - i) * 6 + 1), j * 2).toISOString(),
                }),
            )
        })
    })
}
seed()
onMockReset(seed)

// ---------------------------------------------------------------- handlers

function listItems(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = allItems().filter(
        (i) => (!search || [i.name, i.code].some((v) => v.toLowerCase().includes(search))) && (!q.group || i.group === q.group) && (q.stock !== 'low' || isOut(i) || isLow(i)),
    )
    return ok(config, paginate(config, rows, ['name', 'code', 'group', 'stock']))
}

function summary(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const items = allItems()
    const data: StockSummary = { items: items.length, low: items.filter(isLow).length, out: items.filter(isOut).length }
    return ok(config, data)
}

function listMovements(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = movements.filter(
        (m) =>
            (!search || [m.itemName, m.itemCode, m.detail, m.reference ?? ''].some((v) => v.toLowerCase().includes(search))) &&
            (!q.type || m.type === q.type) &&
            (!q.group || m.group === q.group) &&
            (!q.item || m.itemId === q.item),
    )
    return ok(config, paginate(config, rows, ['createdAt', 'itemName']))
}

function createAdjustment(config: InternalAxiosRequestConfig) {
    const me = requireAdmin(config, DENIED)
    const { itemId, direction, quantity, reason, note } = bodyOf(config)
    const item = allItems().find((i) => i.id === itemId)
    if (!item) fail(config, 404, { message: 'That item no longer exists.', code: 'NOT_FOUND' })

    const errors: Record<string, string> = {}
    if (direction !== 'in' && direction !== 'out') errors.direction = 'Choose add or remove'
    if (typeof quantity !== 'number' || !(quantity > 0)) errors.quantity = 'The quantity must be more than zero'
    else if (item!.unit === 'trips' ? !hasAtMostTwoDecimals(quantity) : !Number.isInteger(quantity)) errors.quantity = item!.unit === 'trips' ? 'Use at most two decimal places' : 'Enter a whole number'
    else if (direction === 'out' && quantity > item!.stock) errors.quantity = `Only ${quantityText(item!.stock, item!.unit)} in stock`
    const allowed: AdjustmentReason[] = direction === 'in' || direction === 'out' ? REASONS_BY_DIRECTION[direction] : []
    if (typeof reason !== 'string' || !allowed.includes(reason as AdjustmentReason)) errors.reason = 'Choose a reason'
    const text = typeof note === 'string' ? note.trim() : ''
    if (reason === 'other' && text === '') errors.note = 'Say what happened'
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })

    const change = (direction === 'in' ? 1 : -1) * (quantity as number)
    const balanceAfter = round2(item!.stock + change)
    setStock(item!.id, balanceAfter)
    const label = REASON_LABELS[reason as AdjustmentReason]
    const movement = movementOf(item!, {
        type: 'adjustment',
        quantity: change,
        balanceAfter,
        reference: null,
        detail: text ? `${label}: ${text}` : label,
        performedBy: me.name,
        createdAt: new Date().toISOString(),
    })
    movements = [...movements, movement]
    return ok(config, movement, 201)
}

export const inventoryRoutes: Route[] = [
    ['GET /inventory/items', listItems],
    ['GET /inventory/summary', summary],
    ['GET /inventory/movements', listMovements],
    ['POST /inventory/adjustments', createAdjustment],
]