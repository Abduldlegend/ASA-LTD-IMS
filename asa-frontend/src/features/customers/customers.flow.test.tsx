import { screen, waitFor, within } from '@testing-library/react'
import { admin, renderApp, signIn, staff } from '@/test/renderApp'

async function open(path: string, account = admin, ready: RegExp | string = /Showing/) {
    const app = renderApp(path)
    await signIn(app.user, screen, account)
    await screen.findByText(ready)
    return app
}

const rowOf = (name: string) => screen.getByText(name).closest('tr')!

async function fillAndSave(user: Awaited<ReturnType<typeof open>>['user'], name: string, phone: string) {
    await user.click(screen.getByRole('button', { name: /add customer/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Add customer' })
    await user.type(within(dialog).getByLabelText(/full name/i), name)
    await user.type(within(dialog).getByLabelText(/^phone/i), phone)
    await user.click(within(dialog).getByRole('button', { name: 'Add customer' }))
    return dialog
}

describe('Customers screen', () => {
    it('lists customers with what they owe, for management', async () => {
        await open('/customers?pageSize=50')
        expect(screen.getByText(/of 24 customers/)).toBeInTheDocument()
        const row = rowOf('Danladi Construction Ltd')
        expect(within(row).getByText('08050000001')).toBeInTheDocument()
        expect(within(row).getByText('₦1,850,000.00')).toBeInTheDocument()
        expect(within(rowOf('Mr. Silas Gambo')).getByText('Inactive')).toBeInTheDocument()
    })

    it('shows staff customers with no balances and no deactivate button', async () => {
        await open('/customers', staff)
        expect(screen.getByText('Danladi Construction Ltd')).toBeInTheDocument()
        expect(screen.queryByRole('columnheader', { name: 'Owes' })).not.toBeInTheDocument()
        expect(screen.queryByText('₦1,850,000.00')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Filter by balance')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /^deactivate/i })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /edit danladi/i })).toBeInTheDocument()
    })

    it('lets staff add a customer', async () => {
        const { user } = await open('/customers', staff)
        await fillAndSave(user, 'Bello Tanimu', '08099998888')
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByText('Bello Tanimu was added')).toBeInTheDocument()
    })

    it('shows the server’s complaint when the phone number is already a customer’s', async () => {
        const { user } = await open('/customers')
        const dialog = await fillAndSave(user, 'Someone New', '+234 805 000 0001')
        expect(await within(dialog).findByText('This number already belongs to Danladi Construction Ltd')).toBeInTheDocument()
    })

    it('asks for the contact person only for a business', async () => {
        const { user } = await open('/customers')
        await user.click(screen.getByRole('button', { name: /add customer/i }))
        const dialog = await screen.findByRole('dialog', { name: 'Add customer' })
        expect(within(dialog).queryByLabelText(/contact person/i)).not.toBeInTheDocument()
        await user.selectOptions(within(dialog).getByLabelText(/^type/i), 'business')
        expect(within(dialog).getByLabelText(/contact person/i)).toBeInTheDocument()
        expect(within(dialog).getByLabelText(/business name/i)).toBeInTheDocument()
    })

    it('edits a customer', async () => {
        const { user } = await open('/customers')
        await user.click(screen.getByRole('button', { name: /edit hajiya maryam/i }))
        const dialog = await screen.findByRole('dialog', { name: 'Edit customer' })
        const name = within(dialog).getByLabelText(/full name/i)
        await user.clear(name)
        await user.type(name, 'Hajiya Maryam A. Abubakar')
        await user.click(within(dialog).getByRole('button', { name: /save/i }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(await screen.findByText('Hajiya Maryam A. Abubakar')).toBeInTheDocument()
    })

    it('lets management deactivate a customer', async () => {
        const { user } = await open('/customers')
        await user.click(screen.getByRole('button', { name: /^deactivate engr\. bala/i }))
        const dialog = await screen.findByRole('dialog', { name: 'Deactivate this customer?' })
        await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }))
        expect(await screen.findByText('Engr. Bala Suleiman was deactivated')).toBeInTheDocument()
        await waitFor(() => expect(within(rowOf('Engr. Bala Suleiman')).getByText('Inactive')).toBeInTheDocument())
    })

    it('filters to the customers who owe money, for management', async () => {
        await open('/customers?balance=owing', admin, /of 8 customers/)
        expect(screen.getByLabelText('Filter by balance')).toHaveValue('owing')
        expect(screen.getByText('Sabon Tasha Roadworks')).toBeInTheDocument()
        expect(screen.queryByText('Hajiya Maryam Abubakar')).not.toBeInTheDocument()
    })

    it('does not let staff find out who owes by using the filter', async () => {
        await open('/customers?balance=owing', staff, /of 24 customers/)
    })
})