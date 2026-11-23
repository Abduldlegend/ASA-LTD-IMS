import { Button, StatusBadge } from '@/components/ui'
import { formatDate, formatNaira } from '@/lib/format'
import type { ProductionBatch } from './types'
import { describePieces, isDue, statusNote } from './units'

export function BatchName({ batch }: { batch: ProductionBatch }) {
    return (
        <div>
            <p className="num font-medium">{batch.code}</p>
            <p className="text-xs text-text-muted">{formatDate(batch.producedOn)}</p>
        </div>
    )
}

export function ProductCell({ batch }: { batch: ProductionBatch }) {
    return (
        <div>
            <p>{batch.productName}</p>
            <p className="num text-xs text-text-muted">{batch.productCode}</p>
        </div>
    )
}

/** The status, with what happens next underneath. */
export function BatchStatusCell({ batch }: { batch: ProductionBatch }) {
    return (
        <div className="flex flex-col items-start gap-1">
            <StatusBadge group="production" status={batch.status} />
            <span className="text-xs text-text-muted">{statusNote(batch)}</span>
        </div>
    )
}

/** What came out of the batch once it was checked. */
export function OutcomeCell({ batch }: { batch: ProductionBatch }) {
    if (batch.quantityReady === null || batch.quantityRejected === null) return <span className="text-text-muted">—</span>
    return (
        <div className="flex flex-col items-end gap-0.5">
            <span className="num">{describePieces(batch, batch.quantityReady)} ready</span>
            {batch.quantityRejected > 0 && <span className="num text-xs text-danger-600">{batch.quantityRejected.toLocaleString('en-NG')} rejected</span>}
        </div>
    )
}

export function CostCell({ batch }: { batch: ProductionBatch }) {
    return batch.materialCost === null ? null : <span className="num">{formatNaira(batch.materialCost)}</span>
}

export interface BatchActionHandlers {
    onView: (batch: ProductionBatch) => void
    onComplete: (batch: ProductionBatch) => void
}

export function BatchActions({ batch, onView, onComplete }: BatchActionHandlers & { batch: ProductionBatch }) {
    return (
        <div className="flex justify-end gap-1">
            {isDue(batch) && (
                <Button size="sm" onClick={() => onComplete(batch)} aria-label={`Mark ${batch.code} ready`}>
                    Mark ready
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onView(batch)} aria-label={`View ${batch.code}`}>
                View
            </Button>
        </div>
    )
}