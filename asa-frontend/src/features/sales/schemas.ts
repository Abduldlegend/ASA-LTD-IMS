import { z } from 'zod'
import { todayISO } from '@/features/production/units'
import { formatNaira } from '@/lib/format'
import { hasAtMostTwoDecimals, isWholeNumber, parseDecimal } from '@/lib/parseNumber'
import type { PaymentInput, SaleInput } from './types'
import { describeStock, METHODS, piecesFor, saleTotal, type SaleCatalog, type SaleProduct } from './units'

/** What is wrong with one line of a sale or an order, if anything. Stock is only checked for a sale: an order does not reserve it. */
export function lineProblem(product: SaleProduct, text: string, checkStock: boolean): { field: 'productId' | 'quantity'; message: string } | null {
    const quantity = parseDecimal(text)
    if (quantity === null) return { field: 'quantity', message: 'Enter the quantity as a number' }
    if (!(quantity > 0)) return { field: 'quantity', message: 'The quantity must be more than zero' }
    if (product.kind === 'interlock' ? !hasAtMostTwoDecimals(quantity) : !isWholeNumber(quantity)) {
        return { field: 'quantity', message: product.kind === 'interlock' ? 'Use at most two decimal places' : 'Enter a whole number' }
    }
    const pieces = piecesFor(product, quantity)
    if (pieces === null) return { field: 'productId', message: 'This design has no pieces-per-m² rate yet, so it cannot be sold' }
    if (checkStock && pieces > product.stock) return { field: 'quantity', message: product.stock === 0 ? 'Out of stock' : `Only ${describeStock(product, product.stock)} in stock` }
    return null
}

const money = (message: string) =>
    z
        .string()
        .trim()
        .min(1, message)
        .refine((v) => parseDecimal(v) !== null, 'Enter the amount as a number')
        .refine((v) => hasAtMostTwoDecimals(parseDecimal(v) ?? 0), 'Use at most two decimal places')

/** Numbers stay as text while the form is open; toSaleInput() converts them once it passes. */
export const saleFormSchema = (catalog: SaleCatalog) =>
    z
        .object({
            /** Empty means a walk-in customer. */
            customerId: z.string(),
            soldOn: z
                .string()
                .min(1, 'Choose the date')
                .refine((v) => v <= todayISO(), 'The date cannot be in the future'),
            lines: z
                .array(z.object({ productId: z.string().min(1, 'Choose a product'), quantity: z.string().trim().min(1, 'Enter the quantity') }))
                .min(1, 'Add at least one item'),
            amountPaid: money('Enter the amount received, or 0 if nothing was paid'),
            method: z.enum(METHODS, { error: 'Choose how it was paid' }),
            note: z.string().trim(),
        })
        .superRefine((values, ctx) => {
            let linesOk = true
            const issue = (path: (string | number)[], message: string) => {
                linesOk = false
                ctx.addIssue({ code: 'custom', path, message })
            }
            const seen = new Set<string>()
            values.lines.forEach((row, i) => {
                const product = catalog[row.productId]
                if (!product) return
                if (seen.has(row.productId)) issue(['lines', i, 'productId'], 'This product is already listed')
                seen.add(row.productId)

                // const quantity = parseDecimal(row.quantity)
                // const at = ['lines', i, 'quantity']
                // if (quantity === null) return issue(at, 'Enter the quantity as a number')
                // if (!(quantity > 0)) return issue(at, 'The quantity must be more than zero')
                // if (product.kind === 'interlock' ? !hasAtMostTwoDecimals(quantity) : !isWholeNumber(quantity)) {
                //     return issue(at, product.kind === 'interlock' ? 'Use at most two decimal places' : 'Enter a whole number')
                // }
                // const pieces = piecesFor(product, quantity)
                // if (pieces === null) return issue(['lines', i, 'productId'], 'This design has no pieces-per-m² rate yet, so it cannot be sold')
                // if (pieces > product.stock) issue(at, product.stock === 0 ? 'Out of stock' : `Only ${describeStock(product, product.stock)} in stock`)

            const problem = lineProblem(product, row.quantity, true)
                if (problem) issue(['lines', i, problem.field], problem.message)
            })
            if (!linesOk) return

            const total = saleTotal(values.lines, catalog)
            const paid = parseDecimal(values.amountPaid)
            if (paid === null) return
            if (paid > total) ctx.addIssue({ code: 'custom', path: ['amountPaid'], message: `That is more than the total of ${formatNaira(total)}` })
            else if (values.customerId === '' && paid < total) {
                ctx.addIssue({ code: 'custom', path: ['amountPaid'], message: 'A walk-in customer must pay in full. Choose a customer to sell on credit.' })
            }
        })

export type SaleFormValues = z.infer<ReturnType<typeof saleFormSchema>>

export function toSaleInput(values: SaleFormValues): SaleInput {
    const paid = parseDecimal(values.amountPaid)!
    return {
        soldOn: values.soldOn,
        customerId: values.customerId || null,
        lines: values.lines.map((l) => ({ productId: l.productId, quantity: parseDecimal(l.quantity)! })),
        payment: paid > 0 ? { amount: paid, method: values.method } : null,
        note: values.note.trim(),
    }
}

/** Money received later against a sale that still has a balance. */
export const paymentFormSchema = (balance: number) =>
    z.object({
        amount: money('Enter the amount received')
            .refine((v) => (parseDecimal(v) ?? 1) > 0, 'The amount must be more than zero')
            .refine((v) => (parseDecimal(v) ?? 0) <= balance, `Only ${formatNaira(balance)} is still owed`),
        method: z.enum(METHODS, { error: 'Choose how it was paid' }),
        note: z.string().trim(),
    })

export type PaymentFormValues = z.infer<ReturnType<typeof paymentFormSchema>>

export const toPaymentInput = (values: PaymentFormValues): PaymentInput => ({ amount: parseDecimal(values.amount)!, method: values.method, note: values.note.trim() })