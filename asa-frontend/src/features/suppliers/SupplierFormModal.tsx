import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Textarea } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { supplierFormSchema, type SupplierFormValues } from './schemas'
import type { Supplier } from './types'
import { useCreateSupplier, useUpdateSupplier } from './useSuppliers'

const FIELDS = ['name', 'contactPerson', 'phone', 'email', 'address'] as const

interface SupplierFormModalProps {
    /** The supplier being edited. Leave out to add a new one. */
    supplier?: Supplier
    onClose: () => void
}

export function SupplierFormModal({ supplier, onClose }: SupplierFormModalProps) {
    const formId = useId()
    const editing = Boolean(supplier)
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const create = useCreateSupplier()
    const update = useUpdateSupplier()

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierFormSchema),
        defaultValues: {
            name: supplier?.name ?? '',
            contactPerson: supplier?.contactPerson ?? '',
            phone: supplier?.phone ?? '',
            email: supplier?.email ?? '',
            address: supplier?.address ?? '',
        },
    })

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            if (supplier) {
                await update.mutateAsync({ id: supplier.id, input: values })
                toast.success('Changes saved')
            } else {
                await create.mutateAsync(values)
                toast.success(`${values.name} was added`)
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
            title={editing ? 'Edit supplier' : 'Add supplier'}
            description={editing ? supplier!.code : 'Who you buy cement, sand, granite and other materials from.'}
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
                            {isSubmitting ? 'Saving' : editing ? 'Save changes' : 'Add supplier'}
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
                <Input label="Supplier name" required autoComplete="off" error={errors.name?.message} {...register('name')} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Contact person" autoComplete="off" error={errors.contactPerson?.message} {...register('contactPerson')} />
                    <Input label="Phone" required type="tel" autoComplete="off" placeholder="0803 000 0000" error={errors.phone?.message} {...register('phone')} />
                </div>
                <Input label="Email" type="email" autoComplete="off" hint="Optional" error={errors.email?.message} {...register('email')} />
                <Textarea label="Address" rows={2} hint="Optional" error={errors.address?.message} {...register('address')} />
            </form>
        </Modal>
    )
}