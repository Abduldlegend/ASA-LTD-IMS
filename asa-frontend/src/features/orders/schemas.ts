import { z } from 'zod'
import { todayISO } from '@/features/production/units'
import { lineProblem } from '@/features/sales/schemas'
import { parseDecimal } from '@/lib/parseNumber'
import type { SaleCatalog } from '@/features/sales/units'
import type { OrderInput } from './types'

/** Numbers stay as text while the form is open; toOrderInput() converts them once it passes. Stock is not checked: an order does not reserve it. */
export const orderFormSchema = (catalog: SaleCatalog) =>
    z
        .object({
            customerId: z.string().min(1, 'Choose the customer'),
            neededBy: z
                .string()
                .min(1, 'Choose the date')
                .refine((v) => v >= todayISO(), 'The date cannot be in the past'),
            lines: z
                .array(z.object({ productId: z.string().min(1, 'Choose a product'), quantity: z.string().trim().min(1, 'Enter the quantity') }))
                .min(1, 'Add at least one item'),
            note: z.string().trim(),
        })
        .superRefine((values, ctx) => {
            const seen = new Set<string>()
            values.lines.forEach((row, i) => {
                const product = catalog[row.productId]
                if (!product) return
                if (seen.has(row.productId)) ctx.addIssue({ code: 'custom', path: ['lines', i, 'productId'], message: 'This product is already listed' })
                seen.add(row.productId)
                const problem = lineProblem(product, row.quantity, false)
                if (problem) ctx.addIssue({ code: 'custom', path: ['lines', i, problem.field], message: problem.message })
            })
        })

export type OrderFormValues = z.infer<ReturnType<typeof orderFormSchema>>

export const toOrderInput = (values: OrderFormValues): OrderInput => ({
    customerId: values.customerId,
    neededBy: values.neededBy,
    lines: values.lines.map((l) => ({ productId: l.productId, quantity: parseDecimal(l.quantity)! })),
    note: values.note.trim(),
})