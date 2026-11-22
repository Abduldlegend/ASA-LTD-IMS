import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { categoryFormSchema, type CategoryFormValues } from './schemas'
import type { Category } from './types'
import { useCreateCategory, useRenameCategory } from './useCatalog'
import { KIND_LABELS, KINDS } from './units'

interface CategoryFormModalProps {
    /** The category being renamed. Leave out to add a new one. */
    category?: Category
    onClose: () => void
}

const FIELDS = ['name', 'kind'] as const

export function CategoryFormModal({ category, onClose }: CategoryFormModalProps) {
    const formId = useId()
    const editing = Boolean(category)
    const [formError, setFormError] = useState<string | null>(null)
    const create = useCreateCategory()
    const rename = useRenameCategory()

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: { name: category?.name ?? '', kind: category?.kind ?? 'block' },
    })

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            if (category) await rename.mutateAsync({ id: category.id, name: values.name })
            else await create.mutateAsync(values)
            toast.success(editing ? 'Category renamed' : `${values.name.trim()} was added`)
            onClose()
        } catch (e) {
            setFormError(applyApiError(e, FIELDS, setError))
        }
    })

    return (
        <Modal
            open
            onClose={isSubmitting ? () => { } : onClose}
            size="sm"
            title={editing ? 'Rename category' : 'Add category'}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} loading={isSubmitting}>
                        {isSubmitting ? 'Saving' : editing ? 'Save' : 'Add category'}
                    </Button>
                </>
            }
        >
            <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4">
                {formError && (
                    <div role="alert" className="flex gap-2.5 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {formError}
                    </div>
                )}
                <Input label="Category name" required autoComplete="off" error={errors.name?.message} {...register('name')} />
                <Select
                    label="Type"
                    required
                    options={KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
                    disabled={editing}
                    hint={editing ? 'The type cannot be changed.' : 'A category holds one type of product.'}
                    error={errors.kind?.message}
                    {...register('kind')}
                />
            </form>
        </Modal>
    )
}