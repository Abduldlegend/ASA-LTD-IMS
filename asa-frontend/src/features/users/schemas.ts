import { z } from 'zod'

const base = {
    name: z.string().trim().min(2, 'Enter the full name'),
    email: z.string().trim().min(1, 'Enter an email address').pipe(z.email('Enter a valid email address')),
    // Optional. Accepts 080…, +234… and spaces or dashes between digits.
    phone: z
        .string()
        .trim()
        .refine((v) => v === '' || /^(\+?234|0)[789]\d{9}$/.test(v.replace(/[\s-]/g, '')), 'Enter a valid Nigerian phone number'),
    role: z.enum(['admin', 'staff'], { error: 'Choose a role' }),
}

const password = z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number')

/**
 * One shape for adding and editing, so one form can serve both. The first password is only asked for
 * (and checked) when adding someone; when editing, the field is not on the form.
 */
export const userFormSchema = (mode: 'create' | 'edit') => z.object({ ...base, password: mode === 'create' ? password : z.string() })

export type UserFormValues = z.infer<ReturnType<typeof userFormSchema>>