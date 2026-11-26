import { Button, Modal } from '@/components/ui'
import { describeLine, perUnit } from '@/features/sales/units'
import { formatDate, formatNaira } from '@/lib/format'
import { NeededByCell, StatusCell } from './OrderParts'
import type { Order } from './types'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="mt-0.5 text-sm">{children}</dd>
        </div>
    )
}

interface OrderDetailsModalProps {
    order: Order
    onFulfil: (order: Order) => void
    onEdit: (order: Order) => void
    onCancelOrder: (order: Order) => void
    onClose: () => void
}

/** One order in full, with what can still be done to it while it is open. */
export function OrderDetailsModal({ order, onFulfil, onEdit, onCancelOrder, onClose }: OrderDetailsModalProps) {
    const open = order.status === 'pending'
    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={order.code}
            description={`${order.customerName} · ordered ${formatDate(order.orderedOn)}`}
            footer={
                <>
                    {open && (
                        <Button variant="ghost" className="mr-auto text-danger-600" onClick={() => onCancelOrder(order)}>
                            Cancel order
                        </Button>
                    )}
                    {open && (
                        <Button variant="outline" onClick={() => onEdit(order)}>
                            Edit
                        </Button>
                    )}
                    {open && <Button onClick={() => onFulfil(order)}>Fulfil</Button>}
                    {!open && <Button onClick={onClose}>Close</Button>}
                </>
            }
        >
            <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Fact label="Status">
                        <StatusCell order={order} />
                    </Fact>
                    <Fact label="Needed by">
                        <NeededByCell order={order} />
                    </Fact>
                    <Fact label="Recorded by">{order.recordedBy}</Fact>
                    {order.cancelledOn && <Fact label="Cancelled on">{formatDate(order.cancelledOn)}</Fact>}
                </dl>

                {order.note && (
                    <div>
                        <p className="text-xs text-text-muted">Note</p>
                        <p className="mt-0.5 text-sm">{order.note}</p>
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
                                    <th className="px-3 py-2 text-right font-medium">Estimate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {order.lines.map((line) => (
                                    <tr key={line.productId}>
                                        <td className="px-3 py-2">{describeLine(line)}</td>
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
                                        Estimated total
                                    </td>
                                    <td className="num px-3 py-2 text-right">{formatNaira(order.estimatedTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {open && <p className="mt-2 text-xs text-text-muted">The sale uses the price on the day it is made, so the final amount can differ.</p>}
                </div>
            </div>
        </Modal>
    )
}