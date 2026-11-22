import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { productFormSchema, toProductInput, type ProductFormValues } from './schemas'
import type { Product, ProductKind } from './types'
import { useCategories, useCreateProduct, useUpdateProduct } from './useCatalog'
import { KIND_LABELS, KINDS, priceLabel, reorderLabel } from './units'

interface ProductFormModalProps {
    /** The product being edited. Leave out to add a new one. */
    product?: Product
    onClose: () => void
}

const FIELDS = ['name', 'kind', 'categoryId', 'price', 'reorderLevel', 'piecesPerSquareMetre'] as const
const KIND_OPTIONS = KINDS.map((kind) => ({ value: kind, label: KIND_LABELS[kind] }))

/** Add or edit a product. The type cannot be changed afterwards, because stock and sales are counted by it. */
export function ProductFormModal({ product, onClose }: ProductFormModalProps) {
    const formId = useId()
    const editing = Boolean(product)
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const categories = useCategories()
    const create = useCreateProduct()
    const update = useUpdateProduct()

    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            kind: product?.kind ?? 'block',
            name: product?.name ?? '',
            categoryId: product?.categoryId ?? '',
            price: product ? String(product.price) : '',
            reorderLevel: product ? String(product.reorderLevel) : '0',
            piecesPerSquareMetre: product?.piecesPerSquareMetre ? String(product.piecesPerSquareMetre) : '',
        },
    })

    const kind = useWatch({ control, name: 'kind' }) as ProductKind
    const categoryOptions = (categories.data ?? []).filter((c) => c.kind === kind).map((c) => ({ value: c.id, label: c.name }))

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        const input = toProductInput(values)
        try {
            if (product) {
                await update.mutateAsync({ id: product.id, input })
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
            title={editing ? 'Edit product' : 'Add product'}
            description={editing ? product!.code : 'Stock starts at zero. It goes up when you record production or a purchase.'}
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
                            {isSubmitting ? 'Saving' : editing ? 'Save changes' : 'Add product'}
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

                <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                        label="Type"
                        required
                        options={KIND_OPTIONS}
                        disabled={editing}
                        hint={editing ? 'The type cannot be changed.' : undefined}
                        error={errors.kind?.message}
                        // Categories belong to one type, so changing the type clears the category.
                        {...register('kind', { onChange: () => setValue('categoryId', '') })}
                    />
                    <Select
                        label="Category"
                        required
                        placeholder="Choose a category"
                        options={categoryOptions}
                        error={errors.categoryId?.message}
                        hint={categories.isPending ? 'Loading categories' : categoryOptions.length === 0 ? 'Add a category for this type first.' : undefined}
                        {...register('categoryId')}
                    />
                </div>

                <Input label="Product name" required autoComplete="off" placeholder="Hollow block 6 inch" error={errors.name?.message} {...register('name')} />

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label={priceLabel(kind)} required inputMode="decimal" autoComplete="off" placeholder="0.00" error={errors.price?.message} {...register('price')} />
                    <Input
                        label={reorderLabel(kind)}
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        hint="Warn when stock falls to this level"
                        error={errors.reorderLevel?.message}
                        {...register('reorderLevel')}
                    />
                </div>

                {kind === 'interlock' && (
                    <Input
                        label="Pieces per square metre"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="Not known yet"
                        hint="Double T is 32 and I-Shape is 50. Without this, the design cannot be sold in m²."
                        error={errors.piecesPerSquareMetre?.message}
                        {...register('piecesPerSquareMetre')}
                    />
                )}
            </form>
        </Modal>
    )
}