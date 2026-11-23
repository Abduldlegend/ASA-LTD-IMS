import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { parseDecimal } from '@/lib/parseNumber'
import { completeBatchSchema, toCompleteInput, type CompleteBatchFormValues } from './schemas'
import type { ProductionBatch } from './types'
import { describePieces } from './units'
import { useCompleteBatch } from './useProduction'

/** Checks a batch after curing. The pieces that are fit to sell join stock; the rest are written off. */
export function CompleteBatchModal({ batch, onClose }: { batch: ProductionBatch; onClose: () => void }) {
    const formId = useId()
    const [formError, setFormError] = useState<string | null>(null)
    const complete = useCompleteBatch()
    const schema = useMemo(() => completeBatchSchema(batch.quantityProduced), [batch.quantityProduced])

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors, isSubmitting },
    } = useForm<CompleteBatchFormValues>({ resolver: zodResolver(schema), defaultValues: { rejected: '0' } })

    const rejected = parseDecimal(useWatch({ control, name: 'rejected' }) ?? '')
    const ready = rejected !== null && Number.isInteger(rejected) && rejected >= 0 && rejected <= batch.quantityProduced ? batch.quantityProduced - rejected : null

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            const done = await complete.mutateAsync({ id: batch.id, input: toCompleteInput(values) })
            toast.success(done.status === 'ready' ? `${describePieces(done, done.quantityReady ?? 0)} of ${done.productName} are ready for sale` : `${done.code} was rejected`)
            onClose()
        } catch (e) {
            setFormError(applyApiError(e, ['rejected'], setError))
        }
    })

    return (
        <Modal
            open
            onClose={isSubmitting ? () => { } : onClose}
            size="sm"
            title="Mark batch ready"
            description={`${batch.code} · ${batch.productName} · ${describePieces(batch, batch.quantityProduced)} made`}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} loading={isSubmitting}>
                        {isSubmitting ? 'Saving' : 'Mark ready'}
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
                <Input
                    label="Pieces rejected"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    hint="Cracked, broken or too weak to sell. Enter 0 if all of them passed."
                    error={errors.rejected?.message}
                    {...register('rejected')}
                />
                {ready !== null && (
                    <p aria-live="polite" className="rounded-md bg-ink-100 px-3 py-2 text-sm text-ink-700">
                        Ready for sale: <strong className="num">{describePieces(batch, ready)}</strong>
                    </p>
                )}
            </form>
        </Modal>
    )
}