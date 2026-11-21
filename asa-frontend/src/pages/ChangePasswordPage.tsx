import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, PageHeader, PasswordInput } from '@/components/ui'
import * as authApi from '@/features/auth/auth.api'
import { changePasswordSchema, PASSWORD_HINT, type ChangePasswordValues } from '@/features/auth/schemas'
import { toApiError } from '@/lib/apiError'

const FIELDS: (keyof ChangePasswordValues)[] = ['currentPassword', 'newPassword', 'confirmPassword']

export function ChangePasswordPage() {
    const [formError, setFormError] = useState<string | null>(null)
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    })

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            await authApi.changePassword(values)
            toast.success('Password changed')
            reset()
        } catch (e) {
            const error = toApiError(e)
            const fieldMessages = Object.entries(error.fieldErrors ?? {}).filter(([field]) =>
                (FIELDS as string[]).includes(field),
            )
            if (fieldMessages.length > 0) {
                for (const [field, message] of fieldMessages) setError(field as keyof ChangePasswordValues, { message })
            } else {
                setFormError(error.message)
            }
        }
    })

    return (
        <>
            <PageHeader title="Change password" description="Choose a new password for your account" />
            <Card className="max-w-lg">
                <form onSubmit={onSubmit} noValidate className="space-y-5 p-5">
                    {formError && (
                        <div role="alert" className="flex gap-2.5 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
                            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                            {formError}
                        </div>
                    )}
                    <PasswordInput
                        label="Current password"
                        autoComplete="current-password"
                        required
                        error={errors.currentPassword?.message}
                        {...register('currentPassword')}
                    />
                    <PasswordInput
                        label="New password"
                        autoComplete="new-password"
                        required
                        hint={PASSWORD_HINT}
                        error={errors.newPassword?.message}
                        {...register('newPassword')}
                    />
                    <PasswordInput
                        label="Confirm new password"
                        autoComplete="new-password"
                        required
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" loading={isSubmitting}>
                            {isSubmitting ? 'Saving' : 'Update password'}
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    )
}