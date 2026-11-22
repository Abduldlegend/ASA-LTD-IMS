import { z } from 'zod'
import { hasAtMostTwoDecimals, isWholeNumber, parseDecimal } from '@/lib/parseNumber'

/**
 * Number fields are kept as text while the form is open, so the box shows what was typed.
 * toProductInput() turns them into numbers once the form passes.
 */
export const productFormSchema = z.object({
    kind: z.enum(['block', 'interlock', 'cement'], { error: 'Choose a type' }),
    name: z.string().trim().min(2, 'Enter the product name'),
    categoryId: z.string().min(1, 'Choose a category'),
    price: z
        .string()
        .trim()
        .min(1, 'Enter a price')
        .refine((v) => parseDecimal(v) !== null, 'Enter the price as a number')
        .refine((v) => (parseDecimal(v) ?? 1) > 0, 'The price must be more than zero')
        .refine((v) => hasAtMostTwoDecimals(parseDecimal(v) ?? 0), 'Use at most two decimal places'),
    reorderLevel: z
        .string()
        .trim()
        .min(1, 'Enter a number, or 0 for none')
        .refine((v) => {
            const n = parseDecimal(v)
            return n !== null && isWholeNumber(n)
        }, 'Enter a whole number'),
    // Empty means "not known yet". Only used for interlocks.
    piecesPerSquareMetre: z
        .string()
        .trim()
        .refine((v) => {
            if (v === '') return true
            const n = parseDecimal(v)
            return n !== null && isWholeNumber(n) && n > 0
        }, 'Enter a whole number of pieces, such as 32'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export function toProductInput(values: ProductFormValues) {
    const rate = values.piecesPerSquareMetre === '' ? null : parseDecimal(values.piecesPerSquareMetre)
    return {
        name: values.name.trim(),
        kind: values.kind,
        categoryId: values.categoryId,
        price: parseDecimal(values.price)!,
        reorderLevel: parseDecimal(values.reorderLevel)!,
        // Blocks and cement have no square-metre rate, whatever was typed before the type was changed.
        piecesPerSquareMetre: values.kind === 'interlock' ? rate : null,
    }
}

export const categoryFormSchema = z.object({
    name: z.string().trim().min(2, 'Enter the category name'),
    kind: z.enum(['block', 'interlock', 'cement'], { error: 'Choose a type' }),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>