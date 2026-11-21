import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().trim().min(1, 'Enter your email address').pipe(z.email('Enter a valid email address')),
    password: z.string().min(1, 'Enter your password'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const PASSWORD_HINT = 'At least 8 characters, with a letter and a number.'

const newPassword = z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number')

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword,
        confirmPassword: z.string().min(1, 'Confirm your new password'),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
        path: ['confirmPassword'],
        message: 'The two passwords do not match',
    })
    .refine((v) => v.newPassword !== v.currentPassword, {
        path: ['newPassword'],
        message: 'The new password must be different from your current one',
    })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>