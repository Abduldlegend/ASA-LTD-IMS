import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, PasswordInput, Select } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { PASSWORD_HINT } from '@/features/auth/schemas'
import { userFormSchema, type UserFormValues } from './schemas'
import type { ManagedUser } from './types'
import { useCreateUser, useUpdateUser } from './useUsers'

interface UserFormModalProps {
    /** The person being edited. Leave out to add a new user. */
    user?: ManagedUser
    /** Whether this is the signed-in person's own account, whose role cannot be changed here. */
    isSelf?: boolean
    onClose: () => void
}

const FIELDS = ['name', 'email', 'phone', 'role', 'password'] as const

const ROLE_OPTIONS = [
    { value: 'staff', label: 'Staff' },
    { value: 'admin', label: 'Management' },
]

/**
 * One form for adding and editing. Mount it only while it is open, so it starts fresh each time.
 * This is the pattern for every create/edit form: schema -> react-hook-form -> mutation -> server errors back onto fields.
 */
export function UserFormModal({ user, isSelf = false, onClose }: UserFormModalProps) {
    const formId = useId()
    const editing = Boolean(user)
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const create = useCreateUser()
    const update = useUpdateUser()

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema(editing ? 'edit' : 'create')),
        defaultValues: {
            name: user?.name ?? '',
            email: user?.email ?? '',
            phone: user?.phone ?? '',
            role: user?.role ?? 'staff',
            password: '',
        },
    })

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async ({ password, ...profile }) => {
        setFormError(null)
        try {
            if (user) {
                await update.mutateAsync({ id: user.id, input: profile })
                toast.success('Changes saved')
            } else {
                await create.mutateAsync({ ...profile, password })
                toast.success(`${profile.name} was added`)
            }
            onClose()
        } catch (e) {
            setFormError(applyApiError(e, FIELDS, setError))
        }
    })

    return (
        <Modal
            open
            onClose={requestClose}
            closeOnBackdrop={!isDirty}
            title={editing ? 'Edit user' : 'Add user'}
            description={editing ? user!.email : 'They can sign in with this email and password.'}
            footer={
                confirmDiscard ? (
                    <>
                        <span className="mr-auto self-center text-sm text-ink-700">Discard your changes?</span>
                        <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
                            Keep editing
                        </Button>
                        <Button variant="danger" onClick={onClose}>
                            Discard
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" onClick={requestClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" form={formId} loading={isSubmitting}>
                            {isSubmitting ? 'Saving' : editing ? 'Save changes' : 'Add user'}
                        </Button>
                    </>
                )
            }
        >
            <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4">
                {formError && (
                    <div role="alert" className="flex gap-2.5 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {formError}
                    </div>
                )}
                <Input label="Full name" required autoComplete="off" error={errors.name?.message} {...register('name')} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Email address" type="email" required autoComplete="off" error={errors.email?.message} {...register('email')} />
                    <Input
                        label="Phone number"
                        type="tel"
                        autoComplete="off"
                        placeholder="0803 000 0000"
                        hint="Optional"
                        error={errors.phone?.message}
                        {...register('phone')}
                    />
                </div>
                <Select
                    label="Role"
                    required
                    options={ROLE_OPTIONS}
                    disabled={isSelf}
                    hint={isSelf ? 'You cannot change your own role.' : 'Management sees finances and settings. Staff do not.'}
                    error={errors.role?.message}
                    {...register('role')}
                />
                {!editing && (
                    <PasswordInput
                        label="First password"
                        required
                        autoComplete="new-password"
                        hint={PASSWORD_HINT}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                )}
            </form>
        </Modal>
    )
}