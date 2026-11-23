import { z } from 'zod'
import { hasAtMostTwoDecimals, isWholeNumber, parseDecimal } from '@/lib/parseNumber'

/** Number fields stay as text while the form is open; toRawMaterialInput() converts them once it passes. */
export const rawMaterialFormSchema = z.object({
    name: z.string().trim().min(2, 'Enter the material name'),
    unit: z.enum(['bags', 'trips', 'litres'], { error: 'Choose a unit' }),
    unitCost: z
        .string()
        .trim()
        .min(1, 'Enter a cost')
        .refine((v) => parseDecimal(v) !== null, 'Enter the cost as a number')
        .refine((v) => (parseDecimal(v) ?? 1) > 0, 'The cost must be more than zero')
        .refine((v) => hasAtMostTwoDecimals(parseDecimal(v) ?? 0), 'Use at most two decimal places'),
    reorderLevel: z
        .string()
        .trim()
        .min(1, 'Enter a number, or 0 for none')
        .refine((v) => {
            const n = parseDecimal(v)
            return n !== null && isWholeNumber(n)
        }, 'Enter a whole number'),
})

export type RawMaterialFormValues = z.infer<typeof rawMaterialFormSchema>

export function toRawMaterialInput(values: RawMaterialFormValues) {
    return {
        name: values.name.trim(),
        unit: values.unit,
        unitCost: parseDecimal(values.unitCost)!,
        reorderLevel: parseDecimal(values.reorderLevel)!,
    }
}