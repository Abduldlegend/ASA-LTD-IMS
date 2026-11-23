import type { InternalAxiosRequestConfig } from 'axios'
import { addDays, format, parseISO, subDays } from 'date-fns'
import type { BatchMaterial, BatchStatus, ProductionBatch, ProductionSummary } from '@/features/production/types'
import { quantityText } from '@/features/inventory/units'
import { formatDate } from '@/lib/format'
import { hasAtMostTwoDecimals } from '@/lib/parseNumber'
import { productStockRows } from './catalog'
import { requireUser } from './guards'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'
import { applyStockChange } from './inventory'
import { paginate } from './listing'
import { materialStockRows } from './procurement'

/**
 *   GET  /production/batches   ?page&pageSize&search&sortBy&sortOrder&status&kind -> Paginated<ProductionBatch>
 *   GET  /production/summary                                                       -> ProductionSummary
 *   POST /production/batches   { productId, producedOn, quantity, materials: [{ materialId, quantity }], note } -> ProductionBatch
 *   POST /production/batches/:id/complete { rejected }                             -> ProductionBatch
 *
 * Recording a batch uses up the raw materials straight away. The pieces only join sellable stock when the
 * batch is checked after curing, and only the ones that were not rejected. Both go through the stock ledger
 * in ./inventory, so they appear in the movement history. Anyone signed in can record and check batches.
 * Staff are never sent costs: `materialCost` and each `unitCost` are null for them.
 */

/** How long a batch cures before it can be checked and sold. The real system will make this a setting. */
const CURING_DAYS = 7

const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const today = () => iso(new Date())

type Stored = Omit<ProductionBatch, 'materialCost'>
let batches: Stored[] = []

// ---------------------------------------------------------------- seed data

type Seed = [product: string, pieces: number, daysAgo: number, status: BatchStatus, rejected: number, note: string]

/** Oldest first, so the numbers run BAT-0001 upwards. Their stock effects are already in the stock figures. */
const SEEDS: Seed[] = [
    ['Hollow block 6 inch', 2000, 34, 'ready', 40, ''],
    ['Hollow block 9 inch', 1200, 30, 'ready', 25, ''],
    ['Double T interlock', 3200, 27, 'ready', 60, 'Grey mix'],
    ['Solid block 6 inch', 1500, 21, 'ready', 18, ''],
    ['I-Shape interlock', 2500, 18, 'ready', 30, ''],
    ['Hollow block 5 inch', 1800, 14, 'ready', 22, ''],
    ['Solid block 9 inch', 500, 10, 'rejected', 500, 'Rain fell on the open yard overnight. The whole batch cracked.'],
    // Nine days old: curing time is over, so it is waiting to be checked.
    ['Hollow block 6 inch', 2400, 9, 'curing', 0, ''],
    ['Hollow block 9 inch', 1000, 5, 'curing', 0, ''],
    ['Double T interlock', 2880, 3, 'curing', 0, ''],
    ['Hollow block 6 inch', 2000, 1, 'curing', 0, 'Second machine'],
]

function seed() {
    const now = new Date()
    const materialRows = materialStockRows()
    const find = (name: string) => materialRows.find((m) => m.name === name)
    const use = (name: string, quantity: number): BatchMaterial[] => {
        const m = find(name)
        return m ? [{ materialId: m.id, name: m.name, unit: m.unit, quantity, unitCost: m.unitCost }] : []
    }

    batches = SEEDS.map(([productName, pieces, daysAgo, status, rejected, note], i) => {
        const product = productStockRows().find((p) => p.name === productName)!
        const producedOn = iso(subDays(now, daysAgo))
        const curingEndsOn = iso(addDays(parseISO(producedOn), CURING_DAYS))
        const done = status !== 'curing'
        const materials =
            product.kind === 'block'
                ? [...use('Cement (for block making)', Math.round(pieces / 30)), ...use('Sharp sand', Math.round((pieces / 600) * 100) / 100), ...use('Water', Math.round(pieces * 1.2))]
                : [...use('Cement (for block making)', Math.round(pieces / 18)), ...use('Granite dust', Math.round((pieces / 900) * 100) / 100), ...use('Water', pieces)]
        return {
            id: `b-${i + 1}`,
            code: `BAT-${String(i + 1).padStart(4, '0')}`,
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            kind: product.kind as 'block' | 'interlock',
            piecesPerSquareMetre: product.piecesPerSquareMetre,
            producedOn,
            curingEndsOn,
            quantityProduced: pieces,
            quantityRejected: done ? rejected : null,
            quantityReady: done ? pieces - rejected : null,
            status,
            completedOn: done ? curingEndsOn : null,
            materials,
            note,
            recordedBy: 'Aisha Bello',
            createdAt: subDays(now, daysAgo).toISOString(),
        }
    })
}
seed()
onMockReset(seed)

// ---------------------------------------------------------------- helpers

const costOf = (b: Stored) => b.materials.reduce((sum, m) => sum + (m.unitCost ?? 0) * m.quantity, 0)

/** Staff are never sent money. */
function show(b: Stored, canSeeMoney: boolean): ProductionBatch {
    return {
        ...b,
        materials: b.materials.map((m) => ({ ...m, unitCost: canSeeMoney ? m.unitCost : null })),
        materialCost: canSeeMoney ? Math.round(costOf(b) * 100) / 100 : null,
    }
}

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISO(v).getTime())

function findBatch(config: InternalAxiosRequestConfig, id: string) {
    const batch = batches.find((b) => b.id === id)
    if (!batch) fail(config, 404, { message: 'That batch no longer exists.', code: 'NOT_FOUND' })
    return batch!
}

// ---------------------------------------------------------------- handlers

function listBatches(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = batches
        .filter(
            (b) =>
                (!search || [b.code, b.productName, b.productCode].some((v) => v.toLowerCase().includes(search))) &&
                (!q.status || b.status === q.status) &&
                (!q.kind || b.kind === q.kind),
        )
        .map((b) => show(b, me.role === 'admin'))
    return ok(config, paginate(config, rows, ['producedOn', 'productName', 'quantityProduced', 'code']))
}

function summary(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const month = today().slice(0, 7)
    const thisMonth = batches.filter((b) => b.producedOn.startsWith(month))
    const curing = batches.filter((b) => b.status === 'curing')
    const finished = thisMonth.filter((b) => b.quantityRejected !== null)
    const finishedPieces = finished.reduce((n, b) => n + b.quantityProduced, 0)
    const rejected = finished.reduce((n, b) => n + (b.quantityRejected ?? 0), 0)
    const data: ProductionSummary = {
        curingBatches: curing.length,
        curingPieces: curing.reduce((n, b) => n + b.quantityProduced, 0),
        producedThisMonth: thisMonth.reduce((n, b) => n + b.quantityProduced, 0),
        rejectedThisMonth: rejected,
        rejectedRate: finishedPieces > 0 ? rejected / finishedPieces : null,
    }
    return ok(config, data)
}

function recordBatch(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    const { productId, producedOn, quantity, materials, note } = bodyOf(config)
    const errors: Record<string, string> = {}

    const product = productStockRows().find((p) => p.id === productId)
    if (!product || !product.active || product.kind === 'cement') errors.productId = 'Choose a block or interlock product that is active'
    if (!isDate(producedOn)) errors.producedOn = 'Choose the date'
    else if (producedOn > today()) errors.producedOn = 'The date cannot be in the future'
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) errors.quantity = 'Enter a whole number of pieces'

    const rows = Array.isArray(materials) ? (materials as { materialId?: unknown; quantity?: unknown }[]) : []
    const stock = materialStockRows()
    const used: BatchMaterial[] = []
    if (rows.length === 0) errors.materials = 'Add at least one material'
    for (const row of rows) {
        const m = stock.find((x) => x.id === row.materialId)
        if (!m || !m.active) errors.materials = 'One of the materials is not available'
        else if (typeof row.quantity !== 'number' || !(row.quantity > 0) || !hasAtMostTwoDecimals(row.quantity)) errors.materials = `Check the amount of ${m.name}`
        else if (used.some((u) => u.materialId === m.id)) errors.materials = `${m.name} is listed twice`
        else if (row.quantity > m.stock) errors.materials = `Not enough ${m.name}: only ${quantityText(m.stock, m.unit)} in stock`
        else used.push({ materialId: m.id, name: m.name, unit: m.unit, quantity: row.quantity, unitCost: m.unitCost })
        if (errors.materials) break
    }
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })

    const code = `BAT-${String(batches.length + 1).padStart(4, '0')}`
    for (const m of used) {
        applyStockChange(`material:${m.materialId}`, -m.quantity, { type: 'usage', reference: code, detail: `Used in batch ${code}`, performedBy: me.name })
    }
    const batch: Stored = {
        id: `b-${batches.length + 1}`,
        code,
        productId: product!.id,
        productCode: product!.code,
        productName: product!.name,
        kind: product!.kind as 'block' | 'interlock',
        piecesPerSquareMetre: product!.piecesPerSquareMetre,
        producedOn: producedOn as string,
        curingEndsOn: iso(addDays(parseISO(producedOn as string), CURING_DAYS)),
        quantityProduced: quantity as number,
        quantityRejected: null,
        quantityReady: null,
        status: 'curing',
        completedOn: null,
        materials: used,
        note: typeof note === 'string' ? note.trim() : '',
        recordedBy: me.name,
        createdAt: new Date().toISOString(),
    }
    batches = [...batches, batch]
    return ok(config, show(batch, me.role === 'admin'), 201)
}

function completeBatch(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    const me = requireUser(config)
    const batch = findBatch(config, id)
    if (batch.status !== 'curing') fail(config, 409, { message: `${batch.code} has already been checked.`, code: 'BATCH_CLOSED' })
    if (batch.curingEndsOn > today()) {
        fail(config, 409, { message: `${batch.code} is still curing. It can be checked from ${formatDate(batch.curingEndsOn)}.`, code: 'STILL_CURING' })
    }
    const { rejected } = bodyOf(config)
    if (typeof rejected !== 'number' || !Number.isInteger(rejected) || rejected < 0) {
        fail(config, 422, { message: 'Check the highlighted fields.', errors: { rejected: 'Enter a whole number' } })
    }
    if ((rejected as number) > batch.quantityProduced) {
        fail(config, 422, { message: 'Check the highlighted fields.', errors: { rejected: `Only ${batch.quantityProduced.toLocaleString('en-NG')} pieces were made` } })
    }

    const ready = batch.quantityProduced - (rejected as number)
    if (ready > 0) {
        applyStockChange(`product:${batch.productId}`, ready, { type: 'production', reference: batch.code, detail: `Batch ${batch.code} checked and ready`, performedBy: me.name })
    }
    batch.quantityRejected = rejected as number
    batch.quantityReady = ready
    batch.status = ready > 0 ? 'ready' : 'rejected'
    batch.completedOn = today()
    return ok(config, show(batch, me.role === 'admin'))
}

export const productionRoutes: Route[] = [
    ['GET /production/batches', listBatches],
    ['GET /production/summary', summary],
    ['POST /production/batches', recordBatch],
    ['POST /production/batches/:id/complete', completeBatch],
]