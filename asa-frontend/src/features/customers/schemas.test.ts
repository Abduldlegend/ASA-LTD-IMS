import { describe, expect, it } from 'vitest'
import { customerFormSchema, toCustomerInput } from './schemas'

const valid = { type: 'individual', name: 'Aisha Garba', contactPerson: '', phone: '0805 000 0008', email: '', address: '', note: '' } as const

describe('customerFormSchema', () => {
    it('accepts a customer with only a name and a phone number', () => {
        expect(customerFormSchema.safeParse(valid).success).toBe(true)
    })

    it('needs a name and a phone number', () => {
        const result = customerFormSchema.safeParse({ ...valid, name: '', phone: '' })
        expect(result.error?.issues.map((i) => i.message)).toEqual(['Enter the name', 'Enter a phone number'])
    })

    it('checks the phone number and the email', () => {
        expect(customerFormSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false)
        expect(customerFormSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false)
        expect(customerFormSchema.safeParse({ ...valid, email: 'a@b.example' }).success).toBe(true)
    })

    it('drops the contact person unless the customer is a business', () => {
        expect(toCustomerInput({ ...valid, contactPerson: 'Someone' }).contactPerson).toBe('')
        expect(toCustomerInput({ ...valid, type: 'business', contactPerson: 'Someone' }).contactPerson).toBe('Someone')
    })
})