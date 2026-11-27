import type { InternalAxiosRequestConfig } from 'axios'
import { subDays } from 'date-fns'
import type { MaterialUnit, RawMaterial } from '@/features/rawMaterials/types'
import type { Supplier } from '@/features/suppliers/types'
import { isNigerianPhone } from '@/lib/phone'
import { requireAdmin, requireUser } from './guards'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'
import { paginate } from './listing'

/**
 *   GET   /suppliers      ?page&pageSize&search&sortBy&sortOrder&status      -> Paginated<Supplier>
 *   POST  /suppliers      { name, contactPerson, phone, email, address }     -> Supplier
 *   PATCH /suppliers/:id  (same)                                             -> Supplier
 *   POST  /suppliers/:id/status { active }                                   -> Supplier
 *
 *   GET   /raw-materials  ?page&pageSize&search&sortBy&sortOrder&unit&status&stock=low -> Paginated<RawMaterial>
 *   POST  /raw-materials  { name, unit, unitCost, reorderLevel }             -> RawMaterial
 *   PATCH /raw-materials/:id  (same; the unit cannot be changed)             -> RawMaterial
 *   POST  /raw-materials/:id/status { active }                               -> RawMaterial
 *
 * Anyone signed in can read; only management can change. Staff are never sent money: `amountOwed`
 * and `unitCost` come back as null for them. Stock is read-only here; purchases and production change it.
 */

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// ---------------------------------------------------------------- seed data

type SupplierSeed = [name: string, contact: string, phone: string, email: string, address: string, owed: number, active: boolean]

const SUPPLIERS: SupplierSeed[] = [
    ['Northern Cement Depot', 'Musa Ibrahim', '08030000001', 'sales@northerncement.example', 'Kawo Industrial Layout, Kaduna', 1_250_000, true],
    ['Rigasa Sand and Gravel', 'Yusuf Danjuma', '08030000002', '', 'Rigasa, Kaduna', 280_000, true],
    ['Kakuri Granite Quarry', 'Sani Bello', '08030000003', 'orders@kakurigranite.example', 'Kakuri, Kaduna South', 0, true],
    ['Zaria Road Haulage', 'Aminu Garba', '08030000004', '', 'Zaria Road, Kaduna', 95_000, true],
    ['Kaduna Water Tankers', 'Hauwa Lawal', '08030000005', '', 'Barnawa, Kaduna', 0, true],
    ['Chikun Aggregates', '', '08030000006', '', 'Chikun, Kaduna', 410_000, true],
    ['Mando Building Supplies', 'Ibrahim Sule', '08030000007', 'info@mandosupplies.example', 'Mando Road, Kaduna', 0, false],
]

type MaterialSeed = [name: string, unit: MaterialUnit, cost: number, reorder: number, stock: number, active: boolean]

const MATERIALS: MaterialSeed[] = [
    ['Cement (for block making)', 'bags', 9200, 200, 480, true],
    ['Sharp sand', 'trips', 28_000, 3, 7.5, true],
    ['Granite 3/8', 'trips', 95_000, 2, 1, true],
    ['Granite dust', 'trips', 35_000, 2, 0, true],
    ['Water', 'litres', 2, 5000, 18_000, true],
    ['Release oil', 'litres', 1800, 20, 35, true],
    ['Fly ash', 'trips', 22_000, 0, 0, false],
]

let suppliers: (Omit<Supplier, 'amountOwed'> & { owed: number })[] = []
let materials: RawMaterial[] = []

function seed() {
    suppliers = SUPPLIERS.map(([name, contactPerson, phone, email, address, owed, active], i) => ({
        id: `s-${i + 1}`,
        code: `SUP-${String(i + 1).padStart(3, '0')}`,
        name,
        contactPerson,
        phone,
        email,
        address,
        owed,
        active,
        createdAt: subDays(new Date(), 400 - i * 20).toISOString(),
    }))
    materials = MATERIALS.map(([name, unit, unitCost, reorderLevel, stock, active], i) => ({
        id: `m-${i + 1}`,
        code: `RAW-${String(i + 1).padStart(3, '0')}`,
        name,
        unit,
        unitCost,
        reorderLevel,
        stock,
        active,
        createdAt: subDays(new Date(), 380 - i * 15).toISOString(),
    }))
}
seed()
onMockReset(seed)

const DENIED = 'Only management can change suppliers and raw materials.'
const UNITS = ['bags', 'trips', 'litres']

// ---------------------------------------------------------------- suppliers

const showSupplier = (s: (typeof suppliers)[number], canSeeMoney: boolean): Supplier => {
    const { owed, ...rest } = s
    return { ...rest, amountOwed: canSeeMoney ? owed : null }
}

function readSupplier(config: InternalAxiosRequestConfig, existingId?: string) {
    const { name, contactPerson, phone, email, address } = bodyOf(config)
    const errors: Record<string, string> = {}
    if (typeof name !== 'string' || name.trim().length < 2) errors.name = 'Enter the supplier name'
    else if (suppliers.some((s) => s.id !== existingId && same(s.name, name))) errors.name = 'A supplier with this name already exists'
    if (typeof phone !== 'string' || !isNigerianPhone(phone.trim())) errors.phone = 'Enter a valid Nigerian phone number'
    if (typeof email === 'string' && email.trim() !== '' && !/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email address'
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })
    const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    return { name: (name as string).trim(), contactPerson: text(contactPerson), phone: (phone as string).trim(), email: text(email), address: text(address) }
}

function listSuppliers(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    const canSeeMoney = me.role === 'admin'
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = suppliers
        .filter(
            (s) =>
                (!search || [s.name, s.code, s.contactPerson, s.phone, s.address].some((v) => v.toLowerCase().includes(search))) &&
                (!q.status || (q.status === 'active') === s.active),
        )
        .map((s) => showSupplier(s, canSeeMoney))
    // Staff cannot sort by money they are not allowed to see.
    const sortable: (keyof Supplier & string)[] = canSeeMoney ? ['name', 'code', 'amountOwed'] : ['name', 'code']
    return ok(config, paginate(config, rows, sortable))
}

function createSupplier(config: InternalAxiosRequestConfig) {
    requireAdmin(config, DENIED)
    const input = readSupplier(config)
    const supplier = { id: `s-${Date.now().toString(36)}`, code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`, ...input, owed: 0, active: true, createdAt: new Date().toISOString() }
    suppliers = [...suppliers, supplier]
    return ok(config, showSupplier(supplier, true), 201)
}

function findSupplier(config: InternalAxiosRequestConfig, id: string) {
    const supplier = suppliers.find((s) => s.id === id)
    if (!supplier) fail(config, 404, { message: 'That supplier no longer exists.', code: 'NOT_FOUND' })
    return supplier!
}

function updateSupplier(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config, DENIED)
    const supplier = findSupplier(config, id)
    Object.assign(supplier, readSupplier(config, id))
    return ok(config, showSupplier(supplier, true))
}

function setSupplierStatus(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config, DENIED)
    const supplier = findSupplier(config, id)
    const { active } = bodyOf(config)
    if (typeof active !== 'boolean') fail(config, 422, { message: 'Say whether the supplier should be active.' })
    supplier.active = active as boolean
    return ok(config, showSupplier(supplier, true))
}

// ---------------------------------------------------------------- raw materials

const showMaterial = (m: RawMaterial, canSeeMoney: boolean): RawMaterial => ({ ...m, unitCost: canSeeMoney ? m.unitCost : null })

const isLow = (m: RawMaterial) => m.stock <= 0 || (m.reorderLevel > 0 && m.stock <= m.reorderLevel)

function readMaterial(config: InternalAxiosRequestConfig, existing?: RawMaterial) {
    const { name, unit: bodyUnit, unitCost, reorderLevel } = bodyOf(config)
    const unit = existing ? existing.unit : bodyUnit
    const errors: Record<string, string> = {}
    if (typeof name !== 'string' || name.trim().length < 2) errors.name = 'Enter the material name'
    else if (materials.some((m) => m.id !== existing?.id && same(m.name, name))) errors.name = 'A material with this name already exists'
    if (typeof unit !== 'string' || !UNITS.includes(unit)) errors.unit = 'Choose a unit'
    if (typeof unitCost !== 'number' || !(unitCost > 0)) errors.unitCost = 'The cost must be more than zero'
    if (typeof reorderLevel !== 'number' || !Number.isInteger(reorderLevel) || reorderLevel < 0) errors.reorderLevel = 'Enter a whole number'
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })
    return { name: (name as string).trim(), unit: unit as MaterialUnit, unitCost: unitCost as number, reorderLevel: reorderLevel as number }
}

function listMaterials(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    const canSeeMoney = me.role === 'admin'
    const q = queryOf(config)
    const search = (q.search ?? '').toLowerCase()
    const rows = materials
        .filter(
            (m) =>
                (!search || [m.name, m.code].some((v) => v.toLowerCase().includes(search))) &&
                (!q.unit || m.unit === q.unit) &&
                (!q.status || (q.status === 'active') === m.active) &&
                (q.stock !== 'low' || isLow(m)),
        )
        .map((m) => showMaterial(m, canSeeMoney))
    const sortable: (keyof RawMaterial & string)[] = canSeeMoney ? ['name', 'code', 'stock', 'unitCost'] : ['name', 'code', 'stock']
    return ok(config, paginate(config, rows, sortable))
}

function createMaterial(config: InternalAxiosRequestConfig) {
    requireAdmin(config, DENIED)
    const input = readMaterial(config)
    const material: RawMaterial = {
        id: `m-${Date.now().toString(36)}`,
        code: `RAW-${String(materials.length + 1).padStart(3, '0')}`,
        ...input,
        stock: 0,
        active: true,
        createdAt: new Date().toISOString(),
    }
    materials = [...materials, material]
    return ok(config, material, 201)
}

function findMaterial(config: InternalAxiosRequestConfig, id: string) {
    const material = materials.find((m) => m.id === id)
    if (!material) fail(config, 404, { message: 'That material no longer exists.', code: 'NOT_FOUND' })
    return material!
}

function updateMaterial(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config, DENIED)
    const material = findMaterial(config, id)
    Object.assign(material, readMaterial(config, material))
    return ok(config, material)
}

function setMaterialStatus(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config, DENIED)
    const material = findMaterial(config, id)
    const { active } = bodyOf(config)
    if (typeof active !== 'boolean') fail(config, 422, { message: 'Say whether the material should be active.' })
    material.active = active as boolean
    return ok(config, material)
}

/** For the inventory mock, which reads and changes stock the way the real server's stock service will. */
export const materialStockRows = () => materials.map((m) => ({ id: m.id, code: m.code, name: m.name, unit: m.unit, unitCost: m.unitCost, stock: m.stock, reorderLevel: m.reorderLevel, active: m.active }))
export function setMaterialStock(id: string, stock: number) {
    const material = materials.find((m) => m.id === id)
    if (material) material.stock = stock
}

export const supplierForPurchase = (id: string) => suppliers.find((s) => s.id === id)
export function addToSupplierOwed(id: string, change: number) {
    const supplier = suppliers.find((s) => s.id === id)
    if (supplier) supplier.owed = Math.max(0, Math.round((supplier.owed + change) * 100) / 100)
}
export function setMaterialUnitCost(id: string, cost: number) {
    const material = materials.find((m) => m.id === id)
    if (material) material.unitCost = cost
}

export const procurementRoutes: Route[] = [
    ['GET /suppliers', listSuppliers],
    ['POST /suppliers', createSupplier],
    ['PATCH /suppliers/:id', updateSupplier],
    ['POST /suppliers/:id/status', setSupplierStatus],
    ['GET /raw-materials', listMaterials],
    ['POST /raw-materials', createMaterial],
    ['PATCH /raw-materials/:id', updateMaterial],
    ['POST /raw-materials/:id/status', setMaterialStatus],
]