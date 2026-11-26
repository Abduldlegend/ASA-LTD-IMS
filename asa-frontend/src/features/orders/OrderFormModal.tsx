import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { todayISO } from '@/features/production/units'
import { useSaleCustomers, useSaleProducts } from '@/features/sales/useSales'
import { describeStock, lineAmount, perUnit, saleTotal, toCatalog, UNIT_BY_KIND, unitWord } from '@/features/sales/units'
import { applyApiError } from '@/lib/formErrors'
import { formatNaira } from '@/lib/format'
import { parseDecimal } from '@/lib/parseNumber'
import { orderFormSchema, toOrderInput, type OrderFormValues } from './schemas'
import type { Order } from './types'
import { useCreateOrder, useUpdateOrder } from './useOrders'

const FIELDS = ['customerId', 'neededBy', 'lines', 'note'] as const

/** Writes down what a customer wants and by when. Nothing leaves stock until the order is fulfilled. */
export function OrderFormModal({ order, onClose }: { order?: Order; onClose: () => void }) {
    const formId = useId()
    const editing = Boolean(order)
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const create = useCreateOrder()
    const update = useUpdateOrder()
    const products = useSaleProducts(true)
    const customers = useSaleCustomers(true)

    const productItems = useMemo(() => products.data?.items ?? [], [products.data])
    const catalog = useMemo(() => toCatalog(productItems), [productItems])
    const schema = useMemo(() => orderFormSchema(catalog), [catalog])

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<OrderFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            customerId: order?.customerId ?? '',
            neededBy: order?.neededBy ?? '',
            lines: order?.lines.map((l) => ({ productId: l.productId, quantity: String(l.quantity) })) ?? [{ productId: '', quantity: '' }],
            note: order?.note ?? '',
        },
    })
    const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
    const rows = useWatch({ control, name: 'lines' })
    const estimate = saleTotal(rows ?? [], catalog)
    const listError = errors.lines?.root?.message ?? errors.lines?.message

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        const input = toOrderInput(values)
        try {
            if (order) {
                await update.mutateAsync({ id: order.id, input })
                toast.success('Changes saved')
            } else {
                const created = await create.mutateAsync(input)
                toast.success(`${created.code} recorded`)
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
            size="lg"
            title={editing ? `Edit ${order!.code}` : 'New order'}
            description="Write down what the customer wants and when. Stock is not set aside until the order is fulfilled."
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
                            {isSubmitting ? 'Saving' : editing ? 'Save changes' : 'Record order'}
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
                        key={customers.data?.items.length ?? 0}
                        label="Customer"
                        required
                        placeholder={customers.isPending ? 'Loading customers' : 'Choose a customer'}
                        options={(customers.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
                        error={errors.customerId?.message}
                        {...register('customerId')}
                    />
                    <Input label="Needed by" required type="date" min={todayISO()} error={errors.neededBy?.message} {...register('neededBy')} />
                </div>

                <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-ink-900">Items</legend>
                    {fields.map((field, i) => {
                        const product = catalog[rows?.[i]?.productId ?? '']
                        const unit = product ? UNIT_BY_KIND[product.kind] : null
                        const quantity = parseDecimal(rows?.[i]?.quantity ?? '')
                        const valid = product && quantity !== null && quantity > 0
                        return (
                            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-start">
                                <Select
                                    // Remounts when the product list arrives, so a saved value is chosen once its option exists.
                                    key={productItems.length}
                                    label={`Product ${i + 1}`}
                                    required
                                    placeholder={products.isPending ? 'Loading products' : 'Choose a product'}
                                    options={productItems.map((p) => ({ value: p.id, label: `${p.name} · ${formatNaira(p.price)} ${perUnit(UNIT_BY_KIND[p.kind])}` }))}
                                    hint={product ? `In stock now: ${describeStock(product, product.stock)}` : undefined}
                                    error={errors.lines?.[i]?.productId?.message}
                                    {...register(`lines.${i}.productId`)}
                                />
                                <Input
                                    label={`Quantity ${i + 1}`}
                                    required
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0"
                                    hint={valid ? formatNaira(lineAmount(product.price, quantity)) : unit ? `In ${unitWord(unit)}` : undefined}
                                    error={errors.lines?.[i]?.quantity?.message}
                                    {...register(`lines.${i}.quantity`)}
                                />
                                {fields.length > 1 && (
                                    <Button variant="ghost" size="sm" className="sm:mt-7" onClick={() => remove(i)} aria-label={`Remove item ${i + 1}`}>
                                        <Trash2 className="size-4" aria-hidden />
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                    {listError && <p className="text-sm text-danger-600">{listError}</p>}
                    <Button variant="outline" size="sm" onClick={() => append({ productId: '', quantity: '' })}>
                        <Plus className="size-4" aria-hidden /> Add item
                    </Button>
                </fieldset>

                <div className="flex items-baseline justify-between rounded-md bg-ink-100 px-3 py-2.5">
                    <span className="text-sm text-ink-700">Estimate at today&rsquo;s prices</span>
                    <strong className="num text-lg" aria-live="polite">
                        {formatNaira(estimate)}
                    </strong>
                </div>

                <Textarea label="Note" rows={2} hint="Optional. For example the delivery address or a deposit already taken." error={errors.note?.message} {...register('note')} />
            </form>
        </Modal>
    )
}