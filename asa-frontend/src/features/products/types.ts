export type ProductKind = 'block' | 'interlock' | 'cement'

export interface Category {
    id: string
    name: string
    /** A category holds one kind of product. Fixed once the category is created. */
    kind: ProductKind
    productCount: number
}

export interface Product {
    id: string
    /** Made by the server, for example "ITL-002". */
    code: string
    name: string
    kind: ProductKind
    categoryId: string
    categoryName: string
    /** Naira. Per piece for blocks, per m² for interlocks, per bag for cement. */
    price: number
    /** Stock at or below this counts as low. In stock units: pieces or bags. */
    reorderLevel: number
    /** Pieces or bags in stock right now. */
    stock: number
    /** Interlocks only. Null until the rate for this design is known; it cannot be sold in m² before that. */
    piecesPerSquareMetre: number | null
    active: boolean
    createdAt: string
}

export interface ProductInput {
    name: string
    kind: ProductKind
    categoryId: string
    price: number
    reorderLevel: number
    piecesPerSquareMetre: number | null
}

export interface CategoryInput {
    name: string
    kind: ProductKind
}