import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { parseDecimal } from '@/lib/parseNumber'
import { quantityText } from '@/features/inventory/units'
import { describePieces, todayISO } from './units'
import { batchFormSchema, toBatchInput, type BatchFormValues, type MaterialStock } from './schemas'
import { useBatchMaterials, useBatchProducts, useRecordBatch } from './useProduction'
import { unitLabel } from '@/lib/format'

const FIELDS = ['productId', 'producedOn', 'quantity', 'materials', 'note'] as const

/** Records a batch that has just been made. Raw materials are used up now; the pieces become sellable after curing. */
export function RecordBatchModal({ onClose }: { onClose: () => void }) {
    const formId = useId()
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const record = useRecordBatch()
    const products = useBatchProducts(true)
    const materials = useBatchMaterials(true)

    const producible = useMemo(() => (products.data?.items ?? []).filter((p) => p.kind !== 'cement'), [products.data])
    const materialItems = useMemo(() => materials.data?.items ?? [], [materials.data])
    const available = useMemo<MaterialStock>(() => Object.fromEntries(materialItems.map((m) => [m.id, { name: m.name, unit: m.unit, stock: m.stock }])), [materialItems])
    const schema = useMemo(() => batchFormSchema(available), [available])

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<BatchFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { productId: '', producedOn: todayISO(), quantity: '', materials: [{ materialId: '', quantity: '' }], note: '' },
    })
    const { fields, append, remove } = useFieldArray({ control, name: 'materials' })
    const [productId, quantity, rows] = useWatch({ control, name: ['productId', 'quantity', 'materials'] })

    const product = producible.find((p) => p.id === productId)
    const pieces = parseDecimal(quantity ?? '')
    // For interlocks, show the area the pieces will cover.
    const area = product?.kind === 'interlock' && pieces !== null && pieces > 0 ? describePieces({ kind: 'interlock', piecesPerSquareMetre: product.piecesPerSquareMetre }, pieces) : null
    const listError = errors.materials?.root?.message ?? errors.materials?.message

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            const batch = await record.mutateAsync(toBatchInput(values))
            toast.success(`${batch.code} recorded. It is under curing.`)
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
            size="lg"
            title="Record a batch"
            description="The raw materials are used up now. The pieces can be sold once curing is done and the batch is checked."
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
                            {isSubmitting ? 'Saving' : 'Record batch'}
                        </Button>
                    </>
                )
            }
        >
            <form id={formId} onSubmit={onSubmit} noValidate className="space-y-5">
                {formError && (
                    <div role="alert" className="flex gap-2.5 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {formError}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                        label="Product"
                        required
                        placeholder={products.isPending ? 'Loading products' : 'Choose a product'}
                        options={producible.map((p) => ({ value: p.id, label: p.name }))}
                        error={errors.productId?.message}
                        {...register('productId')}
                    />
                    <Input label="Date made" required type="date" max={todayISO()} error={errors.producedOn?.message} {...register('producedOn')} />
                </div>

                <Input
                    label="Pieces made"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0"
                    hint={area ? `That is ${area}` : 'Count every piece that came off the machine, including any you already know are cracked.'}
                    error={errors.quantity?.message}
                    {...register('quantity')}
                />

                <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-ink-900">Raw materials used</legend>
                    {fields.map((field, i) => {
                        const chosen = available[rows?.[i]?.materialId ?? '']
                        return (
                            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-start">
                                <Select
                                    label={`Material ${i + 1}`}
                                    required
                                    placeholder={materials.isPending ? 'Loading materials' : 'Choose a material'}
                                    options={materialItems.map((m) => ({ value: m.id, label: `${m.name} (${quantityText(m.stock, m.unit)} in stock)` }))}
                                    error={errors.materials?.[i]?.materialId?.message}
                                    {...register(`materials.${i}.materialId`)}
                                />
                                <Input
                                    label={`Amount ${i + 1}`}
                                    required
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0"
                                    hint={chosen ? `In ${unitLabel(chosen.unit)}` : undefined}
                                    error={errors.materials?.[i]?.quantity?.message}
                                    {...register(`materials.${i}.quantity`)}
                                />
                                {fields.length > 1 && (
                                    <Button variant="ghost" size="sm" className="sm:mt-7" onClick={() => remove(i)} aria-label={`Remove material ${i + 1}`}>
                                        <Trash2 className="size-4" aria-hidden />
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                    {listError && <p className="text-sm text-danger-600">{listError}</p>}
                    <Button variant="outline" size="sm" onClick={() => append({ materialId: '', quantity: '' })}>
                        <Plus className="size-4" aria-hidden /> Add material
                    </Button>
                </fieldset>

                <Textarea label="Note" rows={2} hint="Optional. For example the mix, the machine or the weather." error={errors.note?.message} {...register('note')} />
            </form>
        </Modal>
    )
}