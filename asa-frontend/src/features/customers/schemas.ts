import { z } from 'zod'
import { isNigerianPhone } from '@/lib/phone'
import type { CustomerInput } from './types'

export const customerFormSchema = z.object({
    type: z.enum(['individual', 'business'], { error: 'Choose a type' }),
    name: z.string().trim().min(2, 'Enter the name'),
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
    note: z.string().trim(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export function toCustomerInput(values: CustomerFormValues): CustomerInput {
    return {
        ...values,
        // Only a business has someone to ask for, whatever was typed before the type was changed.
        contactPerson: values.type === 'business' ? values.contactPerson : '',
    }
}