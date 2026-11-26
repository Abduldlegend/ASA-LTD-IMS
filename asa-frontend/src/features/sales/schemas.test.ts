import { describe, expect, it } from 'vitest'
import { paymentFormSchema, saleFormSchema, toSaleInput } from './schemas'
import { piecesFor, saleTotal, toCatalog } from './units'
import type { Product } from '@/features/products/types'

const product = (over: Partial<Product>): Product => ({
    id: 'p', code: 'X', name: 'X', kind: 'block', categoryId: 'c', categoryName: 'C', price: 450, reorderLevel: 0, stock: 100, piecesPerSquareMetre: null, active: true, createdAt: '', ...over,
})
const catalog = toCatalog([
    product({ id: 'blk', name: 'Hollow block 6 inch' }),
    product({ id: 'itl', name: 'Double T', kind: 'interlock', price: 6500, stock: 320, piecesPerSquareMetre: 32 }),
    product({ id: 'new', name: 'Zigzag', kind: 'interlock', price: 6800, stock: 800, piecesPerSquareMetre: null }),
])
const schema = saleFormSchema(catalog)
const valid = { customerId: '', soldOn: '2026-01-01', lines: [{ productId: 'blk', quantity: '10' }], amountPaid: '4500', method: 'cash' as const, note: '' }
const messages = (v: unknown) => schema.safeParse(v).error?.issues.map((i) => i.message)

describe('saleFormSchema', () => {
    it('accepts a walk-in sale that is paid in full', () => {
        expect(schema.safeParse(valid).success).toBe(true)
    })

    it('makes a walk-in customer pay in full, but lets a named customer buy on credit', () => {
        expect(messages({ ...valid, amountPaid: '1000' })).toEqual(['A walk-in customer must pay in full. Choose a customer to sell on credit.'])
        expect(schema.safeParse({ ...valid, customerId: 'c-1', amountPaid: '0' }).success).toBe(true)
    })

    it('does not accept more than the total', () => {
        expect(messages({ ...valid, amountPaid: '5000' })).toEqual(['That is more than the total of ₦4,500.00'])
    })

    it('stops a sale of more than is in stock', () => {
        expect(messages({ ...valid, lines: [{ productId: 'blk', quantity: '101' }], amountPaid: '0' })).toEqual(['Only 100 pcs in stock'])
    })

    it('sells interlocks in m², to two decimals, and checks the pieces against stock', () => {
        const line = (quantity: string) => ({ ...valid, customerId: 'c-1', amountPaid: '0', lines: [{ productId: 'itl', quantity }] })
        expect(schema.safeParse(line('10')).success).toBe(true)
        expect(messages(line('10.001'))).toEqual(['Use at most two decimal places'])
        expect(messages(line('11'))?.[0]).toMatch(/^Only 320 pcs/)
    })

    it('refuses an interlock design that has no rate', () => {
        expect(messages({ ...valid, lines: [{ productId: 'new', quantity: '1' }] })).toEqual(['This design has no pieces-per-m² rate yet, so it cannot be sold'])
    })

    it('wants whole pieces of blocks and no repeated product', () => {
        expect(messages({ ...valid, lines: [{ productId: 'blk', quantity: '2.5' }] })).toEqual(['Enter a whole number'])
        expect(messages({ ...valid, lines: [{ productId: 'blk', quantity: '1' }, { productId: 'blk', quantity: '1' }] })).toEqual(['This product is already listed'])
    })

    it('sends no payment when nothing was paid, and never sends a price', () => {
        const input = toSaleInput({ ...valid, customerId: 'c-1', amountPaid: '0' })
        expect(input.payment).toBeNull()
        expect(input.customerId).toBe('c-1')
        expect(input.lines).toEqual([{ productId: 'blk', quantity: 10 }])
    })
})

describe('sale arithmetic', () => {
    it('turns m² into whole pieces, rounding up', () => {
        expect(piecesFor(catalog.itl, 10)).toBe(320)
        expect(piecesFor(catalog.itl, 1.01)).toBe(33)
        expect(piecesFor(catalog.blk, 7)).toBe(7)
        expect(piecesFor(catalog.new, 1)).toBeNull()
    })

    it('adds up only the lines that are filled in', () => {
        expect(saleTotal([{ productId: 'blk', quantity: '10' }, { productId: 'itl', quantity: '' }, { productId: '', quantity: '5' }], catalog)).toBe(4500)
    })
})

describe('paymentFormSchema', () => {
    const pay = paymentFormSchema(1000)
    it('accepts up to the balance and no more', () => {
        expect(pay.safeParse({ amount: '1,000', method: 'cash', note: '' }).success).toBe(true)
        expect(pay.safeParse({ amount: '1001', method: 'cash', note: '' }).error?.issues[0].message).toBe('Only ₦1,000.00 is still owed')
        expect(pay.safeParse({ amount: '0', method: 'cash', note: '' }).error?.issues[0].message).toBe('The amount must be more than zero')
    })
})