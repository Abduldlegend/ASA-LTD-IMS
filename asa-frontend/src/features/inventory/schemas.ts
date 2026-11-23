import { z } from 'zod'
import { hasAtMostTwoDecimals, isWholeNumber, parseDecimal } from '@/lib/parseNumber'
import type { AdjustmentInput, AdjustmentReason, StockItem } from './types'
import { quantityText, REASON_LABELS, REASONS_BY_DIRECTION } from './units'

/**
 * The form depends on the item: pieces, bags and litres are counted whole, trips may have two decimals,
 * and nothing can be taken out that is not there. The number stays as text while the form is open.
 */
export const adjustmentFormSchema = (item: Pick<StockItem, 'unit' | 'stock'>) =>
    z
        .object({
            direction: z.enum(['in', 'out'], { error: 'Choose add or remove' }),
            quantity: z
                .string()
                .trim()
                .min(1, 'Enter a quantity')
                .refine((v) => parseDecimal(v) !== null, 'Enter the quantity as a number')
                .refine((v) => (parseDecimal(v) ?? 1) > 0, 'The quantity must be more than zero')
                .refine((v) => {
                    const n = parseDecimal(v)
                    if (n === null) return true
                    return item.unit === 'trips' ? hasAtMostTwoDecimals(n) : isWholeNumber(n)
                }, item.unit === 'trips' ? 'Use at most two decimal places' : 'Enter a whole number'),
            reason: z.string().refine((v) => v in REASON_LABELS, 'Choose a reason'),
            note: z.string().trim(),
        })
        .superRefine((values, ctx) => {
            const quantity = parseDecimal(values.quantity)
            if (values.direction === 'out' && quantity !== null && quantity > item.stock) {
                ctx.addIssue({ code: 'custom', path: ['quantity'], message: `Only ${quantityText(item.stock, item.unit)} in stock` })
            }
            if (values.reason in REASON_LABELS && !REASONS_BY_DIRECTION[values.direction].includes(values.reason as AdjustmentReason)) {
                ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Choose a reason' })
            }
            if (values.reason === 'other' && values.note === '') {
                ctx.addIssue({ code: 'custom', path: ['note'], message: 'Say what happened' })
            }
        })

export type AdjustmentFormValues = z.infer<ReturnType<typeof adjustmentFormSchema>>

export function toAdjustmentInput(itemId: string, values: AdjustmentFormValues): AdjustmentInput {
    return {
        itemId,
        direction: values.direction,
        quantity: parseDecimal(values.quantity)!,
        reason: values.reason as AdjustmentReason,
        note: values.note.trim(),
    }
}