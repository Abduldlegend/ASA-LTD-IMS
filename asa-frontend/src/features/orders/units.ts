import { todayISO } from '@/features/production/units'
import type { Order } from './types'

/** Still open and the day the customer wanted it has passed. Dates are YYYY-MM-DD, so they compare as text. */
export const isOverdue = (order: Pick<Order, 'status' | 'neededBy'>, today = todayISO()) => order.status === 'pending' && order.neededBy < today

export const isDueToday = (order: Pick<Order, 'status' | 'neededBy'>, today = todayISO()) => order.status === 'pending' && order.neededBy === today