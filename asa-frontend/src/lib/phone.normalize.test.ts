import { describe, expect, it } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
    it('gives the same result however a number is written', () => {
        expect(normalizePhone('0805 000 0001')).toBe('08050000001')
        expect(normalizePhone('+234 805 000 0001')).toBe('08050000001')
        expect(normalizePhone('2348050000001')).toBe('08050000001')
    })
})