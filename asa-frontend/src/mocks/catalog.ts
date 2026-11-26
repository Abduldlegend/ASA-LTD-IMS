import type { InternalAxiosRequestConfig } from 'axios'
import { subDays } from 'date-fns'
import type { Category, Product, ProductKind } from '@/features/products/types'
import { INTERLOCK_RATES } from '@/lib/interlock'
import type { Paginated } from '@/types/api'
import { unauthorized, userFromBearer } from './authServer'
import { bodyOf, fail, ok, onMockReset, queryOf, type Route } from './http'

/**
 *   GET    /categories                                                       -> Category[]
 *   POST   /categories        { name, kind }                                 -> Category
 *   PATCH  /categories/:id    { name }                                       -> Category
 *   DELETE /categories/:id                                                   -> null
 *   GET    /products          ?page&pageSize&search&sortBy&sortOrder&kind&status&stock=low -> Paginated<Product>
 *   POST   /products          { name, kind, categoryId, price, reorderLevel, piecesPerSquareMetre } -> Product
 *   PATCH  /products/:id      (same; the type cannot be changed)             -> Product
 *   POST   /products/:id/status { active }                                   -> Product
 *
 * Anyone signed in can read. Only management can change. Stock is read-only here; it is changed by purchases, production and sales.
 */

type Seed = [name: string, kind: ProductKind, category: string, price: number, reorder: number, stock: number, rate: number | null, active: boolean]

const CATEGORIES: [id: string, name: string, kind: ProductKind][] = [
    ['c-hollow', 'Hollow blocks', 'block'],
    ['c-solid', 'Solid blocks', 'block'],
    ['c-paving', 'Paving interlocks', 'interlock'],
    ['c-decor', 'Decorative interlocks', 'interlock'],
    ['c-cement', 'Portland cement', 'cement'],
]

const PRODUCTS: Seed[] = [
    ['Hollow block 5 inch', 'block', 'c-hollow', 400, 1000, 2400, null, true],
    ['Hollow block 6 inch', 'block', 'c-hollow', 450, 2000, 5200, null, true],
    ['Hollow block 9 inch', 'block', 'c-hollow', 600, 1500, 900, null, true],
    ['Solid block 6 inch', 'block', 'c-solid', 520, 1000, 1800, null, true],
    ['Solid block 9 inch', 'block', 'c-solid', 680, 500, 0, null, true],
    ['Double T interlock', 'interlock', 'c-paving', 6500, 3200, 6400, INTERLOCK_RATES['Double T'], true],
    ['I-Shape interlock', 'interlock', 'c-paving', 6000, 2500, 4100, INTERLOCK_RATES['I-Shape'], true],
    // Other designs have no pieces-per-m² rate yet, so they cannot be sold in m² until one is set.
    ['Zigzag interlock', 'interlock', 'c-decor', 6800, 0, 800, null, true],
    ['Cobblestone interlock', 'interlock', 'c-decor', 7200, 0, 0, null, false],
    ['Dangote 3X cement 50kg', 'cement', 'c-cement', 9800, 100, 340, null, true],
    ['BUA cement 50kg', 'cement', 'c-cement', 9600, 100, 85, null, true],
    ['Elephant cement 50kg', 'cement', 'c-cement', 9700, 100, 220, null, true],
    ['Ashaka cement 50kg', 'cement', 'c-cement', 9500, 50, 0, null, false],
]

const PREFIX: Record<ProductKind, string> = { block: 'BLK', interlock: 'ITL', cement: 'CEM' }

let categories: Omit<Category, 'productCount'>[] = []
let products: Omit<Product, 'categoryName'>[] = []

function seed() {
    categories = CATEGORIES.map(([id, name, kind]) => ({ id, name, kind }))
    const counts: Record<string, number> = {}
    products = PRODUCTS.map(([name, kind, categoryId, price, reorderLevel, stock, piecesPerSquareMetre, active], i) => {
        counts[kind] = (counts[kind] ?? 0) + 1
        return {
            id: `p-${i + 1}`,
            code: `${PREFIX[kind]}-${String(counts[kind]).padStart(3, '0')}`,
            name,
            kind,
            categoryId,
            price,
            reorderLevel,
            stock,
            piecesPerSquareMetre,
            active,
            createdAt: subDays(new Date(), 300 - i * 7).toISOString(),
        }
    })
}
seed()
onMockReset(seed)

// ---------------------------------------------------------------- helpers

function requireUser(config: InternalAxiosRequestConfig) {
    const me = userFromBearer(config)
    if (!me) unauthorized(config)
    return me!
}

function requireAdmin(config: InternalAxiosRequestConfig) {
    const me = requireUser(config)
    if (me.role !== 'admin') fail(config, 403, { message: 'Only management can change products and categories.', code: 'FORBIDDEN' })
}

const withCount = (c: Omit<Category, 'productCount'>): Category => ({ ...c, productCount: products.filter((p) => p.categoryId === c.id).length })
const withCategory = (p: Omit<Product, 'categoryName'>): Product => ({ ...p, categoryName: categories.find((c) => c.id === p.categoryId)?.name ?? '—' })

const KINDS = ['block', 'interlock', 'cement']
const isKind = (v: unknown): v is ProductKind => typeof v === 'string' && KINDS.includes(v)
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// ---------------------------------------------------------------- categories

function listCategories(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const sorted = [...categories].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
    return ok(config, sorted.map(withCount))
}

function createCategory(config: InternalAxiosRequestConfig) {
    requireAdmin(config)
    const { name, kind } = bodyOf(config)
    const errors: Record<string, string> = {}
    if (typeof name !== 'string' || name.trim().length < 2) errors.name = 'Enter the category name'
    else if (categories.some((c) => sameName(c.name, name))) errors.name = 'A category with this name already exists'
    if (!isKind(kind)) errors.kind = 'Choose a type'
    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })
    const category = { id: `c-${Date.now().toString(36)}`, name: (name as string).trim(), kind: kind as ProductKind }
    categories.push(category)
    return ok(config, withCount(category), 201)
}

function findCategory(config: InternalAxiosRequestConfig, id: string) {
    const category = categories.find((c) => c.id === id)
    if (!category) fail(config, 404, { message: 'That category no longer exists.', code: 'NOT_FOUND' })
    return category!
}

function renameCategory(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config)
    const category = findCategory(config, id)
    const { name } = bodyOf(config)
    if (typeof name !== 'string' || name.trim().length < 2) {
        fail(config, 422, { message: 'Check the highlighted fields.', errors: { name: 'Enter the category name' } })
    }
    if (categories.some((c) => c.id !== id && sameName(c.name, name as string))) {
        fail(config, 422, { message: 'Check the highlighted fields.', errors: { name: 'A category with this name already exists' } })
    }
    category.name = (name as string).trim()
    return ok(config, withCount(category))
}

function deleteCategory(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config)
    const category = findCategory(config, id)
    const count = products.filter((p) => p.categoryId === id).length
    if (count > 0) {
        fail(config, 409, {
            message: `${category.name} still has ${count} ${count === 1 ? 'product' : 'products'}, so it cannot be deleted. Move them to another category first.`,
            code: 'CATEGORY_IN_USE',
        })
    }
    categories = categories.filter((c) => c.id !== id)
    return ok(config, null)
}

// ---------------------------------------------------------------- products

function readProduct(config: InternalAxiosRequestConfig, existing?: Omit<Product, 'categoryName'>) {
    const body = bodyOf(config)
    const errors: Record<string, string> = {}
    const kind = existing ? existing.kind : body.kind
    if (!isKind(kind)) errors.kind = 'Choose a type'

    const { name, categoryId, price, reorderLevel, piecesPerSquareMetre } = body
    if (typeof name !== 'string' || name.trim().length < 2) errors.name = 'Enter the product name'
    else if (products.some((p) => p.id !== existing?.id && sameName(p.name, name))) errors.name = 'A product with this name already exists'

    const category = categories.find((c) => c.id === categoryId)
    if (!category) errors.categoryId = 'Choose a category'
    else if (isKind(kind) && category.kind !== kind) errors.categoryId = 'That category is for a different type of product'

    if (typeof price !== 'number' || !(price > 0)) errors.price = 'The price must be more than zero'
    if (typeof reorderLevel !== 'number' || !Number.isInteger(reorderLevel) || reorderLevel < 0) errors.reorderLevel = 'Enter a whole number'

    const rateGiven = piecesPerSquareMetre !== null && piecesPerSquareMetre !== undefined
    if (kind === 'interlock') {
        if (rateGiven && (typeof piecesPerSquareMetre !== 'number' || !Number.isInteger(piecesPerSquareMetre) || piecesPerSquareMetre <= 0)) {
            errors.piecesPerSquareMetre = 'Enter a whole number of pieces, such as 32'
        }
    } else if (rateGiven) {
        errors.piecesPerSquareMetre = 'Only interlocks have a pieces-per-m² rate'
    }

    if (Object.keys(errors).length) fail(config, 422, { message: 'Check the highlighted fields.', errors })
    return {
        name: (name as string).trim(),
        kind: kind as ProductKind,
        categoryId: categoryId as string,
        price: price as number,
        reorderLevel: reorderLevel as number,
        piecesPerSquareMetre: kind === 'interlock' && rateGiven ? (piecesPerSquareMetre as number) : null,
    }
}

const isLow = (p: Omit<Product, 'categoryName'>) => p.stock <= 0 || (p.reorderLevel > 0 && p.stock <= p.reorderLevel)

function listProducts(config: InternalAxiosRequestConfig) {
    requireUser(config)
    const q = queryOf(config)
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20))
    const search = (q.search ?? '').toLowerCase()

    let rows = products.map(withCategory).filter(
        (p) =>
            (!search || [p.name, p.code, p.categoryName].some((v) => v.toLowerCase().includes(search))) &&
            (!q.kind || p.kind === q.kind) &&
            (!q.status || (q.status === 'active') === p.active) &&
            (q.stock !== 'low' || isLow(p)),
    )

    const keys = ['name', 'code', 'price', 'stock', 'kind', 'categoryName'] as const
    const sortBy = keys.find((k) => k === q.sortBy) ?? 'name'
    const direction = q.sortOrder === 'desc' ? -1 : 1
    rows = [...rows].sort((a, b) => {
        const [x, y] = [a[sortBy], b[sortBy]]
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { sensitivity: 'base' })) * direction
    })

    const data: Paginated<Product> = { items: rows.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: rows.length }
    return ok(config, data)
}

function createProduct(config: InternalAxiosRequestConfig) {
    requireAdmin(config)
    const input = readProduct(config)
    const next = products.filter((p) => p.kind === input.kind).length + 1
    const product = {
        id: `p-${Date.now().toString(36)}`,
        code: `${PREFIX[input.kind]}-${String(next).padStart(3, '0')}`,
        ...input,
        stock: 0,
        active: true,
        createdAt: new Date().toISOString(),
    }
    products = [...products, product]
    return ok(config, withCategory(product), 201)
}

function findProduct(config: InternalAxiosRequestConfig, id: string) {
    const product = products.find((p) => p.id === id)
    if (!product) fail(config, 404, { message: 'That product no longer exists.', code: 'NOT_FOUND' })
    return product!
}

function updateProduct(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config)
    const product = findProduct(config, id)
    Object.assign(product, readProduct(config, product))
    return ok(config, withCategory(product))
}

function setProductStatus(config: InternalAxiosRequestConfig, { id }: Record<string, string>) {
    requireAdmin(config)
    const product = findProduct(config, id)
    const { active } = bodyOf(config)
    if (typeof active !== 'boolean') fail(config, 422, { message: 'Say whether the product should be active.' })
    product.active = active as boolean
    return ok(config, withCategory(product))
}

/** For the inventory mock, which reads and changes stock the way the real server's stock service will. */
export const productStockRows = () =>
    products.map((p) => ({ id: p.id, code: p.code, name: p.name, kind: p.kind, stock: p.stock, reorderLevel: p.reorderLevel, piecesPerSquareMetre: p.piecesPerSquareMetre, active: p.active }))

/** For the sales mock: what a sale needs to know about a product. */
export const productSaleRows = () =>
    products.map((p) => ({ id: p.id, code: p.code, name: p.name, kind: p.kind, price: p.price, stock: p.stock, piecesPerSquareMetre: p.piecesPerSquareMetre, active: p.active }))

export function setProductStock(id: string, stock: number) {
    const product = products.find((p) => p.id === id)
    if (product) product.stock = stock
}

export const catalogRoutes: Route[] = [
    ['GET /categories', listCategories],
    ['POST /categories', createCategory],
    ['PATCH /categories/:id', renameCategory],
    ['DELETE /categories/:id', deleteCategory],
    ['GET /products', listProducts],
    ['POST /products', createProduct],
    ['PATCH /products/:id', updateProduct],
    ['POST /products/:id/status', setProductStatus],
]