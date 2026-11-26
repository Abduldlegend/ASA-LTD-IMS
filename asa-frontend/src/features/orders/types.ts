import type { SaleLine } from '@/features/sales/types'

/** Open until it is turned into a sale (fulfilled) or called off (cancelled). */
export type OrderStatus = 'pending' | 'fulfilled' | 'cancelled'

export type OrderLine = Pick<SaleLine, 'productId' | 'productName' | 'kind' | 'unit' | 'quantity' | 'unitPrice' | 'lineTotal'>

export interface Order {
    id: string
    /** Made by the server, for example "ORD-0007". */
    code: string
    /** YYYY-MM-DD */
    orderedOn: string
    /** The day the customer wants it, as YYYY-MM-DD. */
    neededBy: string
    customerId: string
    customerName: string
    lines: OrderLine[]
    /** Naira, at today's prices when the order was last saved. The sale uses the price on the day it is made. */
    estimatedTotal: number
    status: OrderStatus
    note: string
    recordedBy: string
    /** Set once the order has been turned into a sale. */
    saleCode: string | null
    cancelledOn: string | null
    createdAt: string
}

export interface OrderInput {
    customerId: string
    neededBy: string
    lines: { productId: string; quantity: number }[]
    note: string
}

export interface OrderSummary {
    open: number
    overdue: number
    dueToday: number
}