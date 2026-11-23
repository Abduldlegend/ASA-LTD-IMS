/** What a material is counted in. Cement by the bag, sand and granite by the tipper trip, water by the litre. */
export type MaterialUnit = 'bags' | 'trips' | 'litres'

export interface RawMaterial {
    id: string
    /** Made by the server, for example "RAW-003". */
    code: string
    name: string
    unit: MaterialUnit
    /** Naira per unit, at the latest purchase. Null when the signed-in person is not allowed to see money. */
    unitCost: number | null
    /** Stock at or below this counts as low. */
    reorderLevel: number
    stock: number
    active: boolean
    createdAt: string
}

export interface RawMaterialInput {
    name: string
    unit: MaterialUnit
    unitCost: number
    reorderLevel: number
}