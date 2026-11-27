import type { MaterialUnit } from '@/features/rawMaterials/types'
import type { PaymentInput, PaymentStatus, SalePayment } from '@/features/sales/types'

/** Waiting for management to price it, then approved; or rejected, which takes the goods back out of stock. */
export type PurchaseStatus = 'pending' | 'approved' | 'rejected'

export type PurchaseMethod = 'cash' | 'transfer'

/** Something that can be bought: a raw material, or cement that is resold. */
export interface PurchaseItem {
    /** "material:m-1" or "product:p-10", the same ids the stock ledger uses. */
    id: string
    name: string
    unit: MaterialUnit
    stock: number
    /** Naira per unit at the latest purchase. Null for cement (not tracked) and for anyone who may not see money. */
    lastCost: number | null
}

export interface PurchaseLine {
    itemId: string
    itemName: string
    unit: MaterialUnit
    quantity: number
    /** Null until it is priced, and always null for anyone who may not see money. */
    unitCost: number | null
    lineTotal: number | null
}

export interface Purchase {
    id: string
    /** Made by the server, for example "PUR-0007". */
    code: string
    /** YYYY-MM-DD */
    purchasedOn: string
    supplierId: string
    supplierName: string
    /** The supplier's own invoice or waybill number, if there is one. */
    reference: string
    lines: PurchaseLine[]
    status: PurchaseStatus
    note: string
    recordedBy: string
    decidedBy: string | null
    decidedOn: string | null
    createdAt: string
    // Money. All null for anyone who may not see it, and null while the purchase is still unpriced.
    total: number | null
    amountPaid: number | null
    /** What we still owe the supplier for this purchase. */
    balance: number | null
    paymentStatus: PaymentStatus | null
    payments: SalePayment[]
}

/** Staff leave the costs and payment out; management can fill them in at once. */
export interface PurchaseInput {
    supplierId: string
    purchasedOn: string
    reference: string
    lines: { itemId: string; quantity: number; unitCost?: number }[]
    payment: { amount: number; method: PurchaseMethod } | null
    note: string
}

/** Management prices a pending purchase, and says how much was paid now. */
export interface ApproveInput {
    lines: { itemId: string; unitCost: number }[]
    payment: { amount: number; method: PurchaseMethod } | null
}

export type PurchasePaymentInput = PaymentInput

export interface PurchaseSummary {
    pending: number
    /** Null for anyone who may not see money. */
    boughtThisMonth: number | null
    owedToSuppliers: number | null
}