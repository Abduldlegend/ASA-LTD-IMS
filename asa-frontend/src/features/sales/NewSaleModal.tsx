import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { todayISO } from '@/features/production/units'
import { applyApiError } from '@/lib/formErrors'
import { formatNaira } from '@/lib/format'
import { parseDecimal } from '@/lib/parseNumber'
import { saleFormSchema, toSaleInput, type SaleFormValues } from './schemas'
import { describeStock, lineAmount, METHOD_LABELS, METHODS, perUnit, piecesFor, saleTotal, toCatalog, UNIT_BY_KIND, unitWord } from './units'
import { useCreateSale, useSaleCustomers, useSaleProducts } from './useSales'
import type { Sale, SaleInput } from './types'

const FIELDS = ['customerId', 'soldOn', 'lines', 'amountPaid', 'method', 'note'] as const

interface NewSaleModalProps {
    onClose: () => void
    /** Starts the form from something already agreed, such as a customer order. The customer is then fixed. */
    prefill?: { title: string; customerId: string; customerName: string; lines: { productId: string; quantity: number }[] }
    /** Sends the sale somewhere other than plain "record a sale", for example to fulfil an order. */
    submit?: (input: SaleInput) => Promise<Sale>
}

/** Records a sale at the till: who bought, what, and how much they paid now. The pieces leave stock straight away. */
export function NewSaleModal({ onClose, prefill, submit }: NewSaleModalProps) {
    const formId = useId()
    const [formError, setFormError] = useState<string | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const create = useCreateSale()
    const products = useSaleProducts(true)
    const customers = useSaleCustomers(true)

    const productItems = useMemo(() => products.data?.items ?? [], [products.data])
    const catalog = useMemo(() => toCatalog(productItems), [productItems])
    const schema = useMemo(() => saleFormSchema(catalog), [catalog])

    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<SaleFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            customerId: prefill?.customerId ?? '',
            soldOn: todayISO(),
            lines: prefill?.lines.map((l) => ({ productId: l.productId, quantity: String(l.quantity) })) ?? [{ productId: '', quantity: '' }],
            amountPaid: '',
            method: 'cash',
            note: '',
        },
    })
    const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
    const [customerId, rows, amountPaid] = useWatch({ control, name: ['customerId', 'lines', 'amountPaid'] })

    const total = saleTotal(rows ?? [], catalog)
    const paid = parseDecimal(amountPaid ?? '')
    const owed = paid !== null && paid >= 0 && paid <= total ? total - paid : null
    const listError = errors.lines?.root?.message ?? errors.lines?.message

    const requestClose = () => {
        if (isSubmitting) return
        if (isDirty) setConfirmDiscard(true)
        else onClose()
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            const sale = await (submit ?? create.mutateAsync)(toSaleInput(values))
            toast.success(`${sale.code} recorded for ${formatNaira(sale.total)}`)
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
            title={prefill?.title ?? 'New sale'}
            description="The pieces leave stock as soon as the sale is recorded."
            footer={
                confirmDiscard ? (
                    <>
                        <span className="mr-auto self-center text-sm text-ink-700">Discard this sale?</span>
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
                            {isSubmitting ? 'Saving' : 'Record sale'}
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

                {/* <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                        label="Customer"
                        options={[{ value: '', label: 'Walk-in customer' }, ...(customers.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))]}
                        hint="Choose a customer to sell on credit. A walk-in customer pays in full."
                        error={errors.customerId?.message}
                        {...register('customerId')}
                    />
                    <Input label="Date of sale" required type="date" max={todayISO()} error={errors.soldOn?.message} {...register('soldOn')} />
                </div> */}

                {prefill ? (
                    <div>
                        <p className="text-sm font-medium text-ink-900">Customer</p>
                        <p className="mt-1.5 flex h-10 items-center text-sm">{prefill.customerName}</p>
                    </div>
                ) : (
                    <Select
                        label="Customer"
                        options={[{ value: '', label: 'Walk-in customer' }, ...(customers.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))]}
                        hint="Choose a customer to sell on credit. A walk-in customer pays in full."
                        error={errors.customerId?.message}
                        {...register('customerId')}
                    />
                )}

                <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-ink-900">Items</legend>
                    {fields.map((field, i) => {
                        const product = catalog[rows?.[i]?.productId ?? '']
                        const unit = product ? UNIT_BY_KIND[product.kind] : null
                        const quantity = parseDecimal(rows?.[i]?.quantity ?? '')
                        const valid = product && quantity !== null && quantity > 0
                        const pieces = valid ? piecesFor(product, quantity) : null
                        return (
                            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-start">
                                <Select
                                    key={productItems.length}
                                    label={`Product ${i + 1}`}
                                    required
                                    placeholder={products.isPending ? 'Loading products' : 'Choose a product'}
                                    options={productItems.map((p) => ({ value: p.id, label: `${p.name} · ${formatNaira(p.price)} ${perUnit(UNIT_BY_KIND[p.kind])}` }))}
                                    hint={product ? `In stock: ${describeStock(product, product.stock)}` : undefined}
                                    error={errors.lines?.[i]?.productId?.message}
                                    {...register(`lines.${i}.productId`)}
                                />
                                <Input
                                    label={`Quantity ${i + 1}`}
                                    required
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0"
                                    hint={
                                        valid && unit
                                            ? `${formatNaira(lineAmount(product.price, quantity))}${product.kind === 'interlock' && pieces !== null ? ` · ${pieces.toLocaleString('en-NG')} pcs` : ''}`
                                            : unit
                                                ? `In ${unitWord(unit)}`
                                                : undefined
                                    }
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
                    <span className="text-sm text-ink-700">Total</span>
                    <strong className="num text-lg" aria-live="polite">
                        {formatNaira(total)}
                    </strong>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <Input
                            label="Amount received now"
                            required
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="0"
                            hint={customerId ? 'Enter 0 if all of it is on credit.' : 'A walk-in customer pays the full total.'}
                            error={errors.amountPaid?.message}
                            {...register('amountPaid')}
                        />
                        <Button variant="ghost" size="sm" className="mt-1" disabled={total <= 0} onClick={() => setValue('amountPaid', String(total), { shouldDirty: true, shouldValidate: true })}>
                            Paid in full
                        </Button>
                    </div>
                    <Select label="Paid by" required options={METHODS.map((m) => ({ value: m, label: METHOD_LABELS[m] }))} error={errors.method?.message} {...register('method')} />
                </div>

                {owed !== null && owed > 0 && (
                    <p aria-live="polite" className="rounded-md bg-warning-50 px-3 py-2 text-sm text-ink-900">
                        <strong className="num">{formatNaira(owed)}</strong> will be added to what this customer owes.
                    </p>
                )}

                <Textarea label="Note" rows={2} hint="Optional. For example the delivery address or who collected." error={errors.note?.message} {...register('note')} />
            </form>
        </Modal>
    )
}