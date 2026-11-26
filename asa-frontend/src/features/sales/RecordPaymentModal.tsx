import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { applyApiError } from '@/lib/formErrors'
import { formatNaira } from '@/lib/format'
import { paymentFormSchema, toPaymentInput, type PaymentFormValues } from './schemas'
import type { Sale } from './types'
import { METHOD_LABELS, METHODS } from './units'
import { useRecordPayment } from './useSales'

/** Money received later against a sale that still has a balance. */
export function RecordPaymentModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
    const formId = useId()
    const [formError, setFormError] = useState<string | null>(null)
    const record = useRecordPayment()
    const schema = useMemo(() => paymentFormSchema(sale.balance), [sale.balance])
    const {
        register,
        handleSubmit,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<PaymentFormValues>({ resolver: zodResolver(schema), defaultValues: { amount: '', method: 'cash', note: '' } })

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            const done = await record.mutateAsync({ id: sale.id, input: toPaymentInput(values) })
            toast.success(done.balance > 0 ? `Payment recorded. ${formatNaira(done.balance)} still owed on ${done.code}` : `${done.code} is now fully paid`)
            onClose()
        } catch (e) {
            setFormError(applyApiError(e, ['amount', 'method', 'note'], setError))
        }
    })

    return (
        <Modal
            open
            onClose={isSubmitting ? () => { } : onClose}
            size="sm"
            title="Record payment"
            description={`${sale.code} · ${sale.customerName} · ${formatNaira(sale.balance)} owed`}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} loading={isSubmitting}>
                        {isSubmitting ? 'Saving' : 'Record payment'}
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
                <div>
                    <Input label="Amount received" required inputMode="decimal" autoComplete="off" placeholder="0" error={errors.amount?.message} {...register('amount')} />
                    <Button variant="ghost" size="sm" className="mt-1" onClick={() => setValue('amount', String(sale.balance), { shouldDirty: true, shouldValidate: true })}>
                        Whole balance
                    </Button>
                </div>
                <Select label="Paid by" required options={METHODS.map((m) => ({ value: m, label: METHOD_LABELS[m] }))} error={errors.method?.message} {...register('method')} />
                <Textarea label="Note" rows={2} hint="Optional. For example the transfer reference." error={errors.note?.message} {...register('note')} />
            </form>
        </Modal>
    )
}