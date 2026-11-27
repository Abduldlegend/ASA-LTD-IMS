import { z } from 'zod'
import type { MaterialUnit } from '@/features/rawMaterials/types'
import { todayISO } from '@/features/production/units'
import { lineAmount, round2 } from '@/features/sales/units'
import { formatNaira } from '@/lib/format'
import { hasAtMostTwoDecimals, isWholeNumber, parseDecimal } from '@/lib/parseNumber'
import type { ApproveInput, PurchaseInput } from './types'
import { PURCHASE_METHODS } from './units'

/** Trips can be part loads, so they take two decimals; bags and litres are whole. */
export function quantityProblem(unit: MaterialUnit, text: string): string | null {
    const n = parseDecimal(text)
    if (n === null) return 'Enter the quantity as a number'
    if (!(n > 0)) return 'The quantity must be more than zero'
    if (unit === 'trips' ? !hasAtMostTwoDecimals(n) : !isWholeNumber(n)) return unit === 'trips' ? 'Use at most two decimal places' : 'Enter a whole number'
    return null
}

export function costProblem(text: string): string | null {
    if (text.trim() === '') return 'Enter the cost per unit'
    const n = parseDecimal(text)
    if (n === null) return 'Enter the cost as a number'
    if (!(n > 0)) return 'The cost must be more than zero'
    if (!hasAtMostTwoDecimals(n)) return 'Use at most two decimal places'
    return null
}

/** What is wrong with the amount paid, given what the purchase comes to. */
export function paidProblem(text: string, total: number): string | null {
    if (text.trim() === '') return 'Enter the amount paid, or 0 if nothing was paid'
    const n = parseDecimal(text)
    if (n === null) return 'Enter the amount as a number'
    if (!hasAtMostTwoDecimals(n)) return 'Use at most two decimal places'
    return n > total ? `That is more than the total of ${formatNaira(total)}` : null
}

export type PurchaseItems = Record<string, { name: string; unit: MaterialUnit }>

/**
 * `priced` is true for management, who enter the cost of each item and what was paid. For staff those are not
 * asked for at all: they only say what arrived. Numbers stay as text while the form is open.
 */
export const purchaseFormSchema = (items: PurchaseItems, priced: boolean) =>
    z
        .object({
            supplierId: z.string().min(1, 'Choose the supplier'),
            purchasedOn: z
                .string()
                .min(1, 'Choose the date')
                .refine((v) => v <= todayISO(), 'The date cannot be in the future'),
            reference: z.string().trim(),
            lines: z
                .array(z.object({ itemId: z.string().min(1, 'Choose an item'), quantity: z.string().trim().min(1, 'Enter the quantity'), unitCost: z.string().trim() }))
                .min(1, 'Add at least one item'),
            amountPaid: z.string().trim(),
            method: z.enum(PURCHASE_METHODS, { error: 'Choose how it was paid' }),
            note: z.string().trim(),
        })
        .superRefine((values, ctx) => {
            const add = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })
            const seen = new Set<string>()
            let ok = true
            values.lines.forEach((row, i) => {
                const item = items[row.itemId]
                if (!item) return
                if (seen.has(row.itemId)) {
                    ok = false
                    add(['lines', i, 'itemId'], 'This item is already listed')
                }
                seen.add(row.itemId)
                const q = quantityProblem(item.unit, row.quantity)
                if (q) {
                    ok = false
                    add(['lines', i, 'quantity'], q)
                }
                const c = priced ? costProblem(row.unitCost) : null
                if (c) {
                    ok = false
                    add(['lines', i, 'unitCost'], c)
                }
            })
            if (priced && ok) {
                const problem = paidProblem(values.amountPaid, purchaseTotal(values.lines))
                if (problem) add(['amountPaid'], problem)
            }
        })

export type PurchaseFormValues = z.infer<ReturnType<typeof purchaseFormSchema>>

/** What the lines come to. Lines still being typed count as nothing. */
export function purchaseTotal(rows: { quantity: string; unitCost: string }[]): number {
    return round2(
        rows.reduce((sum, r) => {
            const q = parseDecimal(r.quantity)
            const c = parseDecimal(r.unitCost)
            return q !== null && c !== null && q > 0 && c > 0 ? sum + lineAmount(c, q) : sum
        }, 0),
    )
}

export function toPurchaseInput(values: PurchaseFormValues, priced: boolean): PurchaseInput {
    const paid = priced ? (parseDecimal(values.amountPaid) ?? 0) : 0
    return {
        supplierId: values.supplierId,
        purchasedOn: values.purchasedOn,
        reference: values.reference.trim(),
        lines: values.lines.map((l) => ({ itemId: l.itemId, quantity: parseDecimal(l.quantity)!, ...(priced ? { unitCost: parseDecimal(l.unitCost)! } : {}) })),
        payment: paid > 0 ? { amount: paid, method: values.method } : null,
        note: values.note.trim(),
    }
}

/** Pricing a pending purchase. The quantities are already known, so only the costs and the payment are asked for. */
export const approveFormSchema = (quantities: number[]) =>
    z
        .object({
            lines: z.array(z.object({ itemId: z.string(), unitCost: z.string().trim() })),
            amountPaid: z.string().trim(),
            method: z.enum(PURCHASE_METHODS, { error: 'Choose how it was paid' }),
        })
        .superRefine((values, ctx) => {
            let ok = true
            values.lines.forEach((row, i) => {
                const c = costProblem(row.unitCost)
                if (c) {
                    ok = false
                    ctx.addIssue({ code: 'custom', path: ['lines', i, 'unitCost'], message: c })
                }
            })
            if (!ok) return
            const total = round2(values.lines.reduce((sum, r, i) => sum + lineAmount(parseDecimal(r.unitCost)!, quantities[i]), 0))
            const problem = paidProblem(values.amountPaid, total)
            if (problem) ctx.addIssue({ code: 'custom', path: ['amountPaid'], message: problem })
        })

export type ApproveFormValues = z.infer<ReturnType<typeof approveFormSchema>>

export function toApproveInput(values: ApproveFormValues): ApproveInput {
    const paid = parseDecimal(values.amountPaid) ?? 0
    return {
        lines: values.lines.map((l) => ({ itemId: l.itemId, unitCost: parseDecimal(l.unitCost)! })),
        payment: paid > 0 ? { amount: paid, method: values.method } : null,
    }
}