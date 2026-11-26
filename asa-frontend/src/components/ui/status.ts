import type { Tone } from './Badge'

export type StatusGroup = 'production' | 'payment' | 'approval' | 'delivery' | 'stock' | 'sale'

export const STATUS_MAP: Record<StatusGroup, Record<string, { label: string; tone: Tone }>> = {
  production: {
    produced: { label: 'Produced', tone: 'info' },
    curing: { label: 'Under curing', tone: 'warning' },
    ready: { label: 'Ready for sale', tone: 'success' },
    rejected: { label: 'Rejected / damaged', tone: 'danger' },
  },
  payment: {
    paid: { label: 'Paid', tone: 'success' },
    partial: { label: 'Partially paid', tone: 'warning' },
    unpaid: { label: 'Unpaid', tone: 'danger' },
  },
  approval: {
    pending: { label: 'Pending approval', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
  },
  delivery: {
    pending: { label: 'Pending', tone: 'neutral' },
    assigned: { label: 'Assigned', tone: 'info' },
    in_transit: { label: 'In transit', tone: 'warning' },
    delivered: { label: 'Delivered', tone: 'success' },
    failed: { label: 'Failed', tone: 'danger' },
  },
  stock: {
    ok: { label: 'In stock', tone: 'success' },
    low: { label: 'Low stock', tone: 'warning' },
    out: { label: 'Out of stock', tone: 'danger' },
  },
    sale: {
    completed: { label: 'Completed', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
  },
}
