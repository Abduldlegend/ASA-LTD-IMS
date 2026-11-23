import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import { applyApiError } from '@/lib/formErrors'
import { parseDecimal } from '@/lib/parseNumber'
import { adjustmentFormSchema, toAdjustmentInput, type AdjustmentFormValues } from './schemas'
import type { StockItem } from './types'
import { useAdjustStock } from './useInventory'
import { describeQuantity, REASON_LABELS, REASONS_BY_DIRECTION, round2 } from './units'
import { unitLabel } from '@/lib/format'

const FIELDS = ['direction', 'quantity', 'reason', 'note'] as const
const DIRECTION_OPTIONS = [
    { value: 'in', label: 'Add stock' },
    { value: 'out', label: 'Remove stock' },
]

/** Corrects the count of one item by hand, with a reason, and leaves a record in the movement history. */
export function AdjustStockModal({ item, onClose }: { item: StockItem; onClose: () => void }) {
    const formId = useId()
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const adjust = useAdjustStock()
    const schema = useMemo(() => adjustmentFormSchema(item), [item])

    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<AdjustmentFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { direction: 'in', quantity: '', reason: '', note: '' },
    })

    const [direction, quantity] = useWatch({ control, name: ['direction', 'quantity'] })
    const reasonOptions = REASONS_BY_DIRECTION[direction].map((r) => ({ value: r, label: REASON_LABELS[r] }))

    // What the stock will be, shown before saving so a slip (removing 500 instead of 50) is seen.
    const amount = parseDecimal(quantity ?? '')
    const after = amount !== null && amount > 0 ? round2(direction === 'in' ? item.stock + amount : item.stock - amount) : null

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            const movement = await adjust.mutateAsync(toAdjustmentInput(item.id, values))
            toast.success(`${item.name} now has ${describeQuantity(item, movement.balanceAfter)}`)
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
            title="Adjust stock"
            description={`${item.name} · ${describeQuantity(item, item.stock)} in stock now`}
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
                            {isSubmitting ? 'Saving' : 'Save adjustment'}
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
                        label="What do you want to do?"
                        required
                        options={DIRECTION_OPTIONS}
                        error={errors.direction?.message}
                        // The reasons depend on the direction, so a reason chosen for one may not fit the other.
                        {...register('direction', { onChange: () => setValue('reason', '') })}
                    />
                    <Input
                        label={`Quantity (${unitLabel(item.unit)})`}
                        required
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        error={errors.quantity?.message}
                        {...register('quantity')}
                    />
                </div>

                {after !== null && (
                    <p aria-live="polite" className={cn('rounded-md px-3 py-2 text-sm', after < 0 ? 'bg-danger-50 text-danger-600' : 'bg-ink-100 text-ink-700')}>
                        {after < 0 ? (
                            <>Only {describeQuantity(item, item.stock)} in stock.</>
                        ) : (
                            <>
                                Stock after this change: <strong className="num">{describeQuantity(item, after)}</strong>
                            </>
                        )}
                    </p>
                )}

                <Select label="Reason" required placeholder="Choose a reason" options={reasonOptions} error={errors.reason?.message} {...register('reason')} />
                <Textarea label="Note" rows={2} hint="Required when the reason is Other" error={errors.note?.message} {...register('note')} />
            </form>
        </Modal>
    )
}