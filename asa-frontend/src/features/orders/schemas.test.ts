import { addDays, format } from 'date-fns'
import { describe, expect, it } from 'vitest'
import type { Product } from '@/features/products/types'
import { toCatalog } from '@/features/sales/units'
import { orderFormSchema, toOrderInput } from './schemas'
import { isDueToday, isOverdue } from './units'

const product = (over: Partial<Product>): Product => ({
    id: 'p', code: 'X', name: 'X', kind: 'block', categoryId: 'c', categoryName: 'C', price: 450, reorderLevel: 0, stock: 0, piecesPerSquareMetre: null, active: true, createdAt: '', ...over,
})
const catalog = toCatalog([product({ id: 'blk' }), product({ id: 'new', kind: 'interlock', piecesPerSquareMetre: null })])
const schema = orderFormSchema(catalog)
const day = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')
const valid = { customerId: 'c-1', neededBy: day(3), lines: [{ productId: 'blk', quantity: '500' }], note: '' }
const messages = (v: unknown) => schema.safeParse(v).error?.issues.map((i) => i.message)

describe('orderFormSchema', () => {
    it('accepts an order for more than is in stock, because an order does not reserve stock', () => {
        expect(schema.safeParse(valid).success).toBe(true)
    })

    it('needs a customer, a date that is not past, and at least one item', () => {
        expect(messages({ ...valid, customerId: '' })).toEqual(['Choose the customer'])
        expect(messages({ ...valid, neededBy: day(-1) })).toEqual(['The date cannot be in the past'])
        expect(schema.safeParse({ ...valid, neededBy: day(0) }).success).toBe(true)
        expect(messages({ ...valid, lines: [] })).toEqual(['Add at least one item'])
    })

    it('checks each line the same way a sale does', () => {
        expect(messages({ ...valid, lines: [{ productId: 'blk', quantity: '2.5' }] })).toEqual(['Enter a whole number'])
        expect(messages({ ...valid, lines: [{ productId: 'new', quantity: '4' }] })).toEqual(['This design has no pieces-per-m² rate yet, so it cannot be sold'])
        expect(messages({ ...valid, lines: [{ productId: 'blk', quantity: '1' }, { productId: 'blk', quantity: '1' }] })).toEqual(['This product is already listed'])
    })

    it('converts the text to numbers', () => {
        expect(toOrderInput({ ...valid, note: ' hi ' })).toEqual({ customerId: 'c-1', neededBy: valid.neededBy, lines: [{ productId: 'blk', quantity: 500 }], note: 'hi' })
    })
})

describe('order dates', () => {
    it('is overdue only while open and past its date', () => {
        expect(isOverdue({ status: 'pending', neededBy: '2026-01-01' }, '2026-01-02')).toBe(true)
        expect(isOverdue({ status: 'pending', neededBy: '2026-01-02' }, '2026-01-02')).toBe(false)
        expect(isOverdue({ status: 'fulfilled', neededBy: '2026-01-01' }, '2026-01-02')).toBe(false)
        expect(isDueToday({ status: 'pending', neededBy: '2026-01-02' }, '2026-01-02')).toBe(true)
    })
})