import type { ProductKind } from '@/features/products/types'

/** What a line is counted in: blocks by the piece, interlocks by the square metre, cement by the bag. */
export type SaleUnit = 'pcs' | 'm2' | 'bags'

export type PaymentMethod = 'cash' | 'transfer' | 'pos'

/** How much of the sale has been paid for. */
export type PaymentStatus = 'paid' | 'partial' | 'unpaid'

export type SaleStatus = 'completed' | 'cancelled'

export interface SaleLine {
    productId: string
    productCode: string
    productName: string
    kind: ProductKind
    unit: SaleUnit
    /** In `unit`: pieces, m² or bags. */
    quantity: number
    /** Naira per `unit`, as it was when the sale was made. */
    unitPrice: number
    /** What leaves stock. The same as `quantity` except for interlocks, where m² become whole pieces. */
    pieces: number
    piecesPerSquareMetre: number | null
    lineTotal: number
}

export interface SalePayment {
    id: string
    amount: number
    method: PaymentMethod
    /** YYYY-MM-DD */
    receivedOn: string
    receivedBy: string
    note: string
}

export interface Sale {
    id: string
    /** Made by the server, for example "SAL-0014". */
    code: string
    /** YYYY-MM-DD */
    soldOn: string
    /** Null for a walk-in customer, who pays in full. */
    customerId: string | null
    customerName: string
    lines: SaleLine[]
    total: number
    amountPaid: number
    /** Still to be paid. Zero once cancelled. */
    balance: number
    paymentStatus: PaymentStatus
    status: SaleStatus
    payments: SalePayment[]
    note: string
    recordedBy: string
    createdAt: string
    cancelledOn: string | null
}

export interface SaleInput {
    soldOn: string
    customerId: string | null
    /** Prices are never sent: the server uses the current price. */
    lines: { productId: string; quantity: number }[]
    payment: { amount: number; method: PaymentMethod } | null
    note: string
}

export interface PaymentInput {
    amount: number
    method: PaymentMethod
    note: string
}

/** Money figures across all sales. For management only. */
export interface SalesSummary {
    soldToday: number
    salesToday: number
    soldThisMonth: number
    /** Unpaid balances on completed sales. */
    outstanding: number
}