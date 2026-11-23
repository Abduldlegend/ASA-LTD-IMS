import { format } from 'date-fns'
import { describeQuantity } from '@/features/inventory/units'
import { formatDate } from '@/lib/format'
import type { ProductionBatch } from './types'

/** Today as YYYY-MM-DD, in the browser's own time zone. */
export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

/** Curing time is over, so the batch can be checked. Dates are YYYY-MM-DD, so they compare as text. */
export const isDue = (batch: Pick<ProductionBatch, 'status' | 'curingEndsOn'>, today = todayISO()) => batch.status === 'curing' && batch.curingEndsOn <= today

/** Pieces of a batch's product, with the area they cover for interlocks. */
export const describePieces = (batch: Pick<ProductionBatch, 'kind' | 'piecesPerSquareMetre'>, pieces: number) =>
    describeQuantity({ group: batch.kind, unit: 'pcs', piecesPerSquareMetre: batch.piecesPerSquareMetre }, pieces)

/** The line under the status: what is happening next, or when it finished. */
export function statusNote(batch: ProductionBatch, today = todayISO()): string {
    if (batch.status === 'curing') return isDue(batch, today) ? 'Curing time is up' : `Ready from ${formatDate(batch.curingEndsOn)}`
    return batch.completedOn ? `Checked ${formatDate(batch.completedOn)}` : ''
}