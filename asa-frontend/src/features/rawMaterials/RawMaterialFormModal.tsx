import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { rawMaterialFormSchema, toRawMaterialInput, type RawMaterialFormValues } from './schemas'
import type { MaterialUnit, RawMaterial } from './types'
import { useCreateRawMaterial, useUpdateRawMaterial } from './useRawMaterials'
import { costLabel, MATERIAL_UNITS, reorderLabel, UNIT_NAMES } from './units'

const FIELDS = ['name', 'unit', 'unitCost', 'reorderLevel'] as const
const UNIT_OPTIONS = MATERIAL_UNITS.map((u) => ({ value: u, label: UNIT_NAMES[u] }))

interface RawMaterialFormModalProps {
    /** The material being edited. Leave out to add a new one. */
    material?: RawMaterial
    onClose: () => void
}

/** Add or edit a material. The unit cannot be changed afterwards, because the stock is counted in it. */
export function RawMaterialFormModal({ material, onClose }: RawMaterialFormModalProps) {
    const formId = useId()
    const editing = Boolean(material)
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const create = useCreateRawMaterial()
    const update = useUpdateRawMaterial()

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<RawMaterialFormValues>({
        resolver: zodResolver(rawMaterialFormSchema),
        defaultValues: {
            name: material?.name ?? '',
            unit: material?.unit ?? 'bags',
            unitCost: material?.unitCost != null ? String(material.unitCost) : '',
            reorderLevel: material ? String(material.reorderLevel) : '0',
        },
    })
    const unit = useWatch({ control, name: 'unit' }) as MaterialUnit

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        const input = toRawMaterialInput(values)
        try {
            if (material) {
                await update.mutateAsync({ id: material.id, input })
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
            title={editing ? 'Edit raw material' : 'Add raw material'}
            description={editing ? material!.code : 'Stock starts at zero. It goes up when you record a purchase and down as production uses it.'}
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
                            {isSubmitting ? 'Saving' : editing ? 'Save changes' : 'Add material'}
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
                <Input label="Material name" required autoComplete="off" placeholder="Sharp sand" error={errors.name?.message} {...register('name')} />
                <Select
                    label="Counted in"
                    required
                    options={UNIT_OPTIONS}
                    disabled={editing}
                    hint={editing ? 'The unit cannot be changed.' : 'Cement in bags, sand and granite in trips, water in litres.'}
                    error={errors.unit?.message}
                    {...register('unit')}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label={costLabel(unit)} required inputMode="decimal" autoComplete="off" placeholder="0.00" error={errors.unitCost?.message} {...register('unitCost')} />
                    <Input
                        label={reorderLabel(unit)}
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        hint="Warn when stock falls to this level"
                        error={errors.reorderLevel?.message}
                        {...register('reorderLevel')}
                    />
                </div>
            </form>
        </Modal>
    )
}