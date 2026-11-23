import { z } from 'zod'
import { isNigerianPhone } from '@/lib/phone'

export const supplierFormSchema = z.object({
    name: z.string().trim().min(2, 'Enter the supplier name'),
    contactPerson: z.string().trim(),
    phone: z
        .string()
        .trim()
        .min(1, 'Enter a phone number')
        .refine((v) => v === '' || isNigerianPhone(v), 'Enter a valid Nigerian phone number'),
    // Optional.
    email: z
        .string()
        .trim()
        .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address'),
    address: z.string().trim(),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>