import { screen, waitFor, within } from '@testing-library/react'
import { admin, renderApp, signIn, staff } from '@/test/renderApp'

async function open(path: string, account = admin, ready: RegExp | string = /Showing/) {
    const app = renderApp(path)
    await signIn(app.user, screen, account)
    await screen.findByText(ready)
    return app
}

const rowOf = (code: string) => screen.getByText(code).closest('tr')!
type User = Awaited<ReturnType<typeof open>>['user']

async function openNewSale(user: User) {
    const buttons = screen.getAllByRole('button', { name: /new sale/i })
    await user.click(buttons[buttons.length - 1])
    return screen.findByRole('dialog', { name: 'New sale' })
}

async function pickProduct(user: User, dialog: HTMLElement, label: RegExp, product: RegExp) {
    const select = within(dialog).getByLabelText(label)
    const option = await within(select).findByRole('option', { name: product })
    await user.selectOptions(select, option)
}

describe('Sales screen', () => {
    it('lists sales with what is owed, and the totals for management', async () => {
        await open('/sales')
        expect(screen.getByText(/of 13 sales/)).toBeInTheDocument()
        expect(await screen.findByText('Sold today')).toBeInTheDocument()
        expect(within(rowOf('SAL-0002')).getByText('Danladi Construction Ltd')).toBeInTheDocument()
        expect(within(rowOf('SAL-0002')).getByText('₦376,000.00 owed')).toBeInTheDocument()
        expect(within(rowOf('SAL-0009')).getByText('Cancelled')).toBeInTheDocument()
    })

    it('shows staff the sales, but not the totals across all of them', async () => {
        await open('/sales', staff)
        expect(screen.getByText('SAL-0002')).toBeInTheDocument()
        expect(screen.queryByText('Sold today')).not.toBeInTheDocument()
    })

    it('filters to unpaid sales', async () => {
        await open('/sales?payment=unpaid', admin, /of 1 sales/)
        expect(screen.getByText('SAL-0008')).toBeInTheDocument()
        expect(screen.getByLabelText('Filter by payment')).toHaveValue('unpaid')
    })

    it('records a walk-in sale and shows the total as the items are entered', async () => {
        const { user } = await open('/sales', staff)
        const dialog = await openNewSale(user)
        await pickProduct(user, dialog, /^product 1/i, /Hollow block 6 inch/)
        await user.type(within(dialog).getByLabelText(/^quantity 1/i), '10')
        expect(within(dialog).getAllByText('₦4,500.00').length).toBeGreaterThan(0)
        await user.click(within(dialog).getByRole('button', { name: 'Paid in full' }))
        await user.click(within(dialog).getByRole('button', { name: 'Record sale' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByText('SAL-0014 recorded for ₦4,500.00')).toBeInTheDocument()
    })

    it('will not let a walk-in customer leave a balance', async () => {
        const { user } = await open('/sales')
        const dialog = await openNewSale(user)
        await pickProduct(user, dialog, /^product 1/i, /Hollow block 6 inch/)
        await user.type(within(dialog).getByLabelText(/^quantity 1/i), '10')
        await user.type(within(dialog).getByLabelText(/^amount received now/i), '1000')
        await user.click(within(dialog).getByRole('button', { name: 'Record sale' }))
        expect(await within(dialog).findByText(/walk-in customer must pay in full/i)).toBeInTheDocument()
    })

    it('sells interlocks in m² and shows the pieces', async () => {
        const { user } = await open('/sales')
        const dialog = await openNewSale(user)
        await pickProduct(user, dialog, /^product 1/i, /Double T interlock/)
        await user.type(within(dialog).getByLabelText(/^quantity 1/i), '10')
        expect(within(dialog).getByText(/320 pcs/)).toBeInTheDocument()
        expect(within(dialog).getAllByText('₦65,000.00').length).toBeGreaterThan(0)
    })

    it('stops a sale of something that is out of stock', async () => {
        const { user } = await open('/sales')
        const dialog = await openNewSale(user)
        await pickProduct(user, dialog, /^product 1/i, /Solid block 9 inch/)
        await user.type(within(dialog).getByLabelText(/^quantity 1/i), '1')
        await user.type(within(dialog).getByLabelText(/^amount received now/i), '0')
        await user.selectOptions(within(dialog).getByLabelText(/^customer/i), await within(dialog).findByRole('option', { name: /Aisha Garba/ }))
        await user.click(within(dialog).getByRole('button', { name: 'Record sale' }))
        expect(await within(dialog).findByText('Out of stock')).toBeInTheDocument()
    })

    it('sells on credit to a customer and takes a later payment', async () => {
        const { user } = await open('/sales')
        const dialog = await openNewSale(user)
        await user.selectOptions(within(dialog).getByLabelText(/^customer/i), await within(dialog).findByRole('option', { name: /Aisha Garba/ }))
        await pickProduct(user, dialog, /^product 1/i, /Hollow block 6 inch/)
        await user.type(within(dialog).getByLabelText(/^quantity 1/i), '10')
        await user.type(within(dialog).getByLabelText(/^amount received now/i), '1000')
        expect(within(dialog).getByText(/will be added to what this customer owes/)).toBeInTheDocument()
        await user.click(within(dialog).getByRole('button', { name: 'Record sale' }))
        expect((await screen.findAllByText('SAL-0014 recorded for ₦4,500.00')).length).toBeGreaterThan(0)

        await user.click(await screen.findByRole('button', { name: 'Record payment for SAL-0014' }))
        const pay = await screen.findByRole('dialog', { name: 'Record payment' })
        await user.click(within(pay).getByRole('button', { name: 'Whole balance' }))
        await user.click(within(pay).getByRole('button', { name: 'Record payment' }))
        expect(await screen.findByText('SAL-0014 is now fully paid')).toBeInTheDocument()
    })

    it('lets management cancel a sale, and staff cannot', async () => {
        const { user } = await open('/sales')
        await user.click(screen.getByRole('button', { name: 'View SAL-0002' }))
        const details = await screen.findByRole('dialog', { name: 'SAL-0002' })
        await user.click(within(details).getByRole('button', { name: 'Cancel sale' }))
        const confirm = await screen.findByRole('dialog', { name: 'Cancel this sale?' })
        await user.click(within(confirm).getByRole('button', { name: 'Cancel sale' }))
        expect(await screen.findByText('SAL-0002 was cancelled and its stock put back')).toBeInTheDocument()
        await waitFor(() => expect(within(rowOf('SAL-0002')).getByText('Cancelled')).toBeInTheDocument())
    })

    it('shows staff the sale in full, with no way to cancel it', async () => {
        const { user } = await open('/sales', staff)
        await user.click(screen.getByRole('button', { name: 'View SAL-0002' }))
        const details = await screen.findByRole('dialog', { name: 'SAL-0002' })
        expect(within(details).getByText('₦976,000.00')).toBeInTheDocument()
        expect(within(details).queryByRole('button', { name: 'Cancel sale' })).not.toBeInTheDocument()
    })
})