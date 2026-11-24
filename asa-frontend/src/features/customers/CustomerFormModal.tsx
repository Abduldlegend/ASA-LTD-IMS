import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { customerFormSchema, toCustomerInput, type CustomerFormValues } from './schemas'
import type { Customer } from './types'
import { useCreateCustomer, useUpdateCustomer } from './useCustomers'

const FIELDS = ['type', 'name', 'contactPerson', 'phone', 'email', 'address', 'note'] as const
const TYPE_OPTIONS = [
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Business or contractor' },
]

interface CustomerFormModalProps {
    /** The customer being edited. Leave out to add a new one. */
    customer?: Customer
    onClose: () => void
}

export function CustomerFormModal({ customer, onClose }: CustomerFormModalProps) {
    const formId = useId()
    const editing = Boolean(customer)
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const create = useCreateCustomer()
    const update = useUpdateCustomer()

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: {
            type: customer?.type ?? 'individual',
            name: customer?.name ?? '',
            contactPerson: customer?.contactPerson ?? '',
            phone: customer?.phone ?? '',
            email: customer?.email ?? '',
            address: customer?.address ?? '',
            note: customer?.note ?? '',
        },
    })
    const business = useWatch({ control, name: 'type' }) === 'business'

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        const input = toCustomerInput(values)
        try {
            if (customer) {
                await update.mutateAsync({ id: customer.id, input })
                toast.success('Changes saved')
            } else {
                await create.mutateAsync(input)
                toast.success(`${input.name} was added`)
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
            title={editing ? 'Edit customer' : 'Add customer'}
            description={editing ? customer!.code : 'Who buys blocks, interlocks and cement from you.'}
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
                            {isSubmitting ? 'Saving' : editing ? 'Save changes' : 'Add customer'}
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

                <Select label="Type" required options={TYPE_OPTIONS} error={errors.type?.message} {...register('type')} />
                <Input label={business ? 'Business name' : 'Full name'} required autoComplete="off" error={errors.name?.message} {...register('name')} />
                <div className="grid gap-4 sm:grid-cols-2">
                    {business && <Input label="Contact person" autoComplete="off" hint="Who to ask for" error={errors.contactPerson?.message} {...register('contactPerson')} />}
                    <Input
                        label="Phone"
                        required
                        type="tel"
                        autoComplete="off"
                        placeholder="0803 000 0000"
                        className={business ? undefined : 'sm:col-span-2'}
                        error={errors.phone?.message}
                        {...register('phone')}
                    />
                </div>
                <Input label="Email" type="email" autoComplete="off" hint="Optional" error={errors.email?.message} {...register('email')} />
                <Textarea label="Address" rows={2} hint="Where to deliver, if different each time leave it blank" error={errors.address?.message} {...register('address')} />
                <Textarea label="Note" rows={2} hint="Optional. Anything the next person serving them should know." error={errors.note?.message} {...register('note')} />
            </form>
        </Modal>
    )
}