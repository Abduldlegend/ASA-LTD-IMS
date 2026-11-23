import { Button, Modal, StatusBadge } from '@/components/ui'
import { quantityText } from '@/features/inventory/units'
import { formatDate, formatNaira } from '@/lib/format'
import type { ProductionBatch } from './types'
import { describePieces, statusNote } from './units'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="mt-0.5 text-sm">{children}</dd>
        </div>
    )
}

/** Everything about one batch, read-only: what was made, what it used, and how it turned out. */
export function BatchDetailsModal({ batch, onClose }: { batch: ProductionBatch; onClose: () => void }) {
    const showCost = batch.materialCost !== null
    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={batch.code}
            description={batch.productName}
            footer={<Button onClick={onClose}>Close</Button>}
        >
            <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Fact label="Status">
                        <div className="flex flex-col items-start gap-1">
                            <StatusBadge group="production" status={batch.status} />
                            <span className="text-xs text-text-muted">{statusNote(batch)}</span>
                        </div>
                    </Fact>
                    <Fact label="Made on">{formatDate(batch.producedOn)}</Fact>
                    <Fact label="Recorded by">{batch.recordedBy}</Fact>
                    <Fact label="Pieces made">
                        <span className="num">{describePieces(batch, batch.quantityProduced)}</span>
                    </Fact>
                    <Fact label="Ready for sale">
                        <span className="num">{batch.quantityReady === null ? '—' : describePieces(batch, batch.quantityReady)}</span>
                    </Fact>
                    <Fact label="Rejected">
                        <span className="num">{batch.quantityRejected === null ? '—' : batch.quantityRejected.toLocaleString('en-NG')}</span>
                    </Fact>
                </dl>

                {batch.note && (
                    <div>
                        <p className="text-xs text-text-muted">Note</p>
                        <p className="mt-0.5 text-sm">{batch.note}</p>
                    </div>
                )}

                <div>
                    <h3 className="mb-2 text-sm font-medium">Raw materials used</h3>
                    <div className="overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-ink-100 text-left text-xs text-text-muted">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Material</th>
                                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                                    {showCost && <th className="px-3 py-2 text-right font-medium">Cost</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {batch.materials.map((m) => (
                                    <tr key={m.materialId}>
                                        <td className="px-3 py-2">{m.name}</td>
                                        <td className="num px-3 py-2 text-right">{quantityText(m.quantity, m.unit)}</td>
                                        {showCost && <td className="num px-3 py-2 text-right">{m.unitCost === null ? '—' : formatNaira(m.unitCost * m.quantity)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                            {showCost && (
                                <tfoot>
                                    <tr className="border-t border-border font-medium">
                                        <td className="px-3 py-2" colSpan={2}>
                                            Material cost
                                        </td>
                                        <td className="num px-3 py-2 text-right">{formatNaira(batch.materialCost!)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    )
}