export interface Supplier {
    id: string
    /** Made by the server, for example "SUP-004". */
    code: string
    name: string
    contactPerson: string
    phone: string
    email: string
    address: string
    active: boolean
    /** Naira we owe this supplier. Null when the signed-in person is not allowed to see money. */
    amountOwed: number | null
    createdAt: string
}

export interface SupplierInput {
    name: string
    contactPerson: string
    phone: string
    email: string
    address: string
}