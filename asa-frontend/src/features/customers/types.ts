export type CustomerType = 'individual' | 'business'

export interface Customer {
    id: string
    /** Made by the server, for example "CUS-014". */
    code: string
    name: string
    type: CustomerType
    /** Who to ask for at a business. Empty for individuals. */
    contactPerson: string
    phone: string
    email: string
    address: string
    note: string
    active: boolean
    /** Naira this customer owes. Null when the signed-in person is not allowed to see money. */
    balanceOwed: number | null
    createdAt: string
}

export interface CustomerInput {
    name: string
    type: CustomerType
    contactPerson: string
    phone: string
    email: string
    address: string
    note: string
}