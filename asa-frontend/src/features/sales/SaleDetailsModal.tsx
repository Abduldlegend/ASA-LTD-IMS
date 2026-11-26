import { Button, Modal } from '@/components/ui'
import { formatDate, formatNaira } from '@/lib/format'
import { PaymentCell } from './SaleParts'
import type { Sale } from './types'
import { describeLine, METHOD_LABELS, perUnit } from './units'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="mt-0.5 text-sm">{children}</dd>
        </div>
    )
}

interface SaleDetailsModalProps {
    sale: Sale
    canCancel: boolean
    onPay: (sale: Sale) => void
    onCancelSale: (sale: Sale) => void
    onClose: () => void
}

/** One sale in full: the items, what has been paid, and what is still owed. */
export function SaleDetailsModal({ sale, canCancel, onPay, onCancelSale, onClose }: SaleDetailsModalProps) {
    const open = sale.status === 'completed'
    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={sale.code}
            description={`${sale.customerName} · ${formatDate(sale.soldOn)}`}
            footer={
                <>
                    {open && canCancel && (
                        <Button variant="ghost" className="mr-auto text-danger-600" onClick={() => onCancelSale(sale)}>
                            Cancel sale
                        </Button>
                    )}
                    {open && sale.balance > 0 && (
                        <Button variant="outline" onClick={() => onPay(sale)}>
                            Record payment
                        </Button>
                    )}
                    <Button onClick={onClose}>Close</Button>
                </>
            }
        >
            <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Fact label="Payment">
                        <PaymentCell sale={sale} />
                    </Fact>
                    <Fact label="Recorded by">{sale.recordedBy}</Fact>
                    {sale.cancelledOn && <Fact label="Cancelled on">{formatDate(sale.cancelledOn)}</Fact>}
                </dl>

                {sale.note && (
                    <div>
                        <p className="text-xs text-text-muted">Note</p>
                        <p className="mt-0.5 text-sm">{sale.note}</p>
                    </div>
                )}

                <div>
                    <h3 className="mb-2 text-sm font-medium">Items</h3>
                    <div className="overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-ink-100 text-left text-xs text-text-muted">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Item</th>
                                    <th className="px-3 py-2 text-right font-medium">Price</th>
                                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sale.lines.map((line) => (
                                    <tr key={line.productId}>
                                        <td className="px-3 py-2">
                                            {describeLine(line)}
                                            {line.unit === 'm2' && <span className="num block text-xs text-text-muted">{line.pieces.toLocaleString('en-NG')} pcs from stock</span>}
                                        </td>
                                        <td className="num px-3 py-2 text-right">
                                            {formatNaira(line.unitPrice)} <span className="text-xs text-text-muted">{perUnit(line.unit)}</span>
                                        </td>
                                        <td className="num px-3 py-2 text-right">{formatNaira(line.lineTotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-border">
                                <tr className="font-medium">
                                    <td className="px-3 py-2" colSpan={2}>
                                        Total
                                    </td>
                                    <td className="num px-3 py-2 text-right">{formatNaira(sale.total)}</td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-2" colSpan={2}>
                                        Paid
                                    </td>
                                    <td className="num px-3 py-2 text-right">{formatNaira(sale.amountPaid)}</td>
                                </tr>
                                {sale.balance > 0 && (
                                    <tr className="font-medium">
                                        <td className="px-3 py-2" colSpan={2}>
                                            Still owed
                                        </td>
                                        <td className="num px-3 py-2 text-right">{formatNaira(sale.balance)}</td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-medium">Payments</h3>
                    {sale.payments.length === 0 ? (
                        <p className="text-sm text-text-muted">Nothing has been paid yet.</p>
                    ) : (
                        <ul className="divide-y divide-border rounded-md border border-border text-sm">
                            {sale.payments.map((p) => (
                                <li key={p.id} className="flex items-start justify-between gap-3 px-3 py-2">
                                    <div>
                                        <p>
                                            {METHOD_LABELS[p.method]} · {formatDate(p.receivedOn)}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            Received by {p.receivedBy}
                                            {p.note ? ` · ${p.note}` : ''}
                                        </p>
                                    </div>
                                    <span className="num font-medium">{formatNaira(p.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {sale.status === 'cancelled' && sale.amountPaid > 0 && (
                        <p className="mt-2 text-xs text-text-muted">This sale was cancelled. Money already received has to be given back by hand.</p>
                    )}
                </div>
            </div>
        </Modal>
    )
}