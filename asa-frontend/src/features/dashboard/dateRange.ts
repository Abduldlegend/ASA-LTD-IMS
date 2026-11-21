import {
    differenceInCalendarDays,
    format,
    isValid,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns'
import type { DashboardRange } from '@/types/dashboard'

export type RangePreset = 'today' | 'week' | 'month' | 'custom'

export const PRESET_LABELS: Record<RangePreset, string> = {
    today: 'Today',
    week: 'This week',
    month: 'This month',
    custom: 'Custom range',
}

/** The longest range the dashboard will chart. */
export const MAX_RANGE_DAYS = 366

const ISO = 'yyyy-MM-dd'

export function toIsoDate(date: Date): string {
    return format(date, ISO)
}

/** Weeks start on Monday. */
export function rangeForPreset(preset: Exclude<RangePreset, 'custom'>, now: Date = new Date()): DashboardRange {
    const to = toIsoDate(now)
    if (preset === 'today') return { from: to, to }
    if (preset === 'week') return { from: toIsoDate(startOfWeek(now, { weekStartsOn: 1 })), to }
    return { from: toIsoDate(startOfMonth(now)), to }
}

export function daysInRange(range: DashboardRange): number {
    return differenceInCalendarDays(parseISO(range.to), parseISO(range.from)) + 1
}

export function rangeError(range: DashboardRange): string | null {
    const from = parseISO(range.from)
    const to = parseISO(range.to)
    if (!isValid(from) || !isValid(to)) return 'Choose both a start and an end date'
    if (from > to) return 'The start date must be on or before the end date'
    if (daysInRange(range) > MAX_RANGE_DAYS) return 'Choose a range of one year or less'
    return null
}

export function isValidRange(range: DashboardRange): boolean {
    return rangeError(range) === null
}

export function describeRange(preset: RangePreset, range: DashboardRange): string {
    if (preset !== 'custom') return PRESET_LABELS[preset]
    const from = parseISO(range.from)
    const to = parseISO(range.to)
    if (!isValid(from) || !isValid(to)) return 'Custom range'
    return `${format(from, 'd MMM')} to ${format(to, 'd MMM yyyy')}`
}