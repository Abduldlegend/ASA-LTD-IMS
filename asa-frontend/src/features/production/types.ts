import type { MaterialUnit } from '@/features/rawMaterials/types'

/** Blocks and interlocks are made here. Cement is bought and resold, so it is never produced. */
export type ProducedKind = 'block' | 'interlock'

/** Under curing until it is checked; then ready for sale, or rejected if none of it was fit to sell. */
export type BatchStatus = 'curing' | 'ready' | 'rejected'

export interface BatchMaterial {
    materialId: string
    name: string
    unit: MaterialUnit
    quantity: number
    /** Naira per unit when the batch was made. Null when the signed-in person is not allowed to see money. */
    unitCost: number | null
}

export interface ProductionBatch {
    id: string
    /** Made by the server, for example "BAT-0012". */
    code: string
    productId: string
    productCode: string
    productName: string
    kind: ProducedKind
    /** Interlocks only. */
    piecesPerSquareMetre: number | null
    /** The day it was made, as YYYY-MM-DD. */
    producedOn: string
    /** The first day it can be checked and sold, as YYYY-MM-DD. */
    curingEndsOn: string
    quantityProduced: number
    /** Known once the batch has been checked. */
    quantityRejected: number | null
    quantityReady: number | null
    status: BatchStatus
    completedOn: string | null
    materials: BatchMaterial[]
    /** Naira. Null when the signed-in person is not allowed to see money. */
    materialCost: number | null
    note: string
    recordedBy: string
    createdAt: string
}

export interface ProductionSummary {
    curingBatches: number
    curingPieces: number
    producedThisMonth: number
    rejectedThisMonth: number
    /** Share of this month's finished pieces that were rejected, 0 to 1. Null until a batch is finished. */
    rejectedRate: number | null
}

export interface BatchInput {
    productId: string
    producedOn: string
    quantity: number
    materials: { materialId: string; quantity: number }[]
    note: string
}

export interface CompleteBatchInput {
    rejected: number
}