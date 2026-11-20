import { format, isValid, parseISO } from 'date-fns'

export type Unit = 'pcs' | 'm2' | 'bags' | 'trips' | 'litres'

const UNIT_LABELS: Record<Unit, string> = {
  pcs: 'pcs',
  m2: 'm²',
  bags: 'bags',
  trips: 'trips',
  litres: 'L',
}

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactNaira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const quantity = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 })

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value)
}

/** Amounts are in naira (the API sends decimals as strings or numbers). */
export function formatNaira(amount: number | string): string {
  const n = toNumber(amount)
  return Number.isFinite(n) ? naira.format(n) : '—'
}

export function formatNairaCompact(amount: number | string): string {
  const n = toNumber(amount)
  return Number.isFinite(n) ? compactNaira.format(n) : '—'
}

export function formatQuantity(value: number | string, unit?: Unit): string {
  const n = toNumber(value)
  if (!Number.isFinite(n)) return '—'
  const text = quantity.format(n)
  return unit ? `${text} ${UNIT_LABELS[unit]}` : text
}

export function unitLabel(unit: Unit): string {
  return UNIT_LABELS[unit]
}

function toDate(value: Date | string): Date | null {
  const d = typeof value === 'string' ? parseISO(value) : value
  return isValid(d) ? d : null
}

export function formatDate(value: Date | string): string {
  const d = toDate(value)
  return d ? format(d, 'dd MMM yyyy') : '—'
}

export function formatDateTime(value: Date | string): string {
  const d = toDate(value)
  return d ? format(d, 'dd MMM yyyy, h:mm a') : '—'
}
