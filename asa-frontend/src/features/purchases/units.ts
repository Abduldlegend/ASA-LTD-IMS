import { quantityText } from '@/features/inventory/units'
import type { PurchaseLine, PurchaseMethod } from './types'

export const PURCHASE_METHODS: PurchaseMethod[] = ['cash', 'transfer']

/** "200 bags Cement (for block making)". */
export const describeLine = (line: Pick<PurchaseLine, 'quantity' | 'unit' | 'itemName'>) => `${quantityText(line.quantity, line.unit)} ${line.itemName}`