import { z } from 'zod'
import { quantityText } from '@/features/inventory/units'
import type { MaterialUnit } from '@/features/rawMaterials/types'
import { hasAtMostTwoDecimals, isWholeNumber, parseDecimal } from '@/lib/parseNumber'
import type { BatchInput, CompleteBatchInput } from './types'
import { todayISO } from './units'

/** What the form needs to know about each raw material, so it can stop a batch that uses more than is in stock. */
export type MaterialStock = Record<string, { name: string; unit: MaterialUnit; stock: number }>

const wholePositive = (v: string) => {
    const n = parseDecimal(v)
    return n !== null && isWholeNumber(n) && n > 0
}

/** Numbers stay as text while the form is open; toBatchInput() converts them once it passes. */
export const batchFormSchema = (available: MaterialStock) =>
    z
        .object({
            productId: z.string().min(1, 'Choose a product'),
            producedOn: z
                .string()
                .min(1, 'Choose the date')
                .refine((v) => v <= todayISO(), 'The date cannot be in the future'),
            quantity: z.string().trim().min(1, 'Enter how many pieces were made').refine(wholePositive, 'Enter a whole number of pieces'),
            materials: z
                .array(
                    z.object({
                        materialId: z.string().min(1, 'Choose a material'),
                        quantity: z
                            .string()
                            .trim()
                            .min(1, 'Enter the amount used')
                            .refine((v) => parseDecimal(v) !== null, 'Enter the amount as a number')
                            .refine((v) => (parseDecimal(v) ?? 1) > 0, 'The amount must be more than zero')
                            .refine((v) => hasAtMostTwoDecimals(parseDecimal(v) ?? 0), 'Use at most two decimal places'),
                    }),
                )
                .min(1, 'Add at least one material'),
            note: z.string().trim(),
        })
        .superRefine((values, ctx) => {
            const seen = new Set<string>()
            values.materials.forEach((row, i) => {
                if (!row.materialId) return
                if (seen.has(row.materialId)) ctx.addIssue({ code: 'custom', path: ['materials', i, 'materialId'], message: 'This material is already listed' })
                seen.add(row.materialId)
                const amount = parseDecimal(row.quantity)
                const material = available[row.materialId]
                if (material && amount !== null && amount > material.stock) {
                    ctx.addIssue({ code: 'custom', path: ['materials', i, 'quantity'], message: `Only ${quantityText(material.stock, material.unit)} in stock` })
                }
            })
        })

export type BatchFormValues = z.infer<ReturnType<typeof batchFormSchema>>

export function toBatchInput(values: BatchFormValues): BatchInput {
    return {
        productId: values.productId,
        producedOn: values.producedOn,
        quantity: parseDecimal(values.quantity)!,
        materials: values.materials.map((m) => ({ materialId: m.materialId, quantity: parseDecimal(m.quantity)! })),
        note: values.note.trim(),
    }
}

/** Checking a batch: how many of the pieces made were not fit to sell. */
export const completeBatchSchema = (produced: number) =>
    z.object({
        rejected: z
            .string()
            .trim()
            .min(1, 'Enter a number, or 0 if none')
            .refine((v) => {
                const n = parseDecimal(v)
                return n !== null && isWholeNumber(n)
            }, 'Enter a whole number')
            .refine((v) => (parseDecimal(v) ?? 0) <= produced, `Only ${produced.toLocaleString('en-NG')} pieces were made`),
    })

export type CompleteBatchFormValues = z.infer<ReturnType<typeof completeBatchSchema>>

export const toCompleteInput = (values: CompleteBatchFormValues): CompleteBatchInput => ({ rejected: parseDecimal(values.rejected)! })