import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { addDays, format } from 'date-fns'
import { admin, renderApp, signIn, staff } from '@/test/renderApp'

async function open(path: string, account = admin, ready: RegExp | string = /Showing/) {
    const app = renderApp(path)
    await signIn(app.user, screen, account)
    await screen.findByText(ready)
    return app
}

const rowOf = (code: string) => screen.getByText(code).closest('tr')!
const day = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')
type User = Awaited<ReturnType<typeof open>>['user']

async function choose(user: User, select: HTMLElement, option: RegExp) {
    await user.selectOptions(select, await within(select).findByRole('option', { name: option }))
}

async function openNewOrder(user: User) {
    const buttons = screen.getAllByRole('button', { name: /new order/i })
    await user.click(buttons[buttons.length - 1])
    return screen.findByRole('dialog', { name: 'New order' })
}

describe('Orders screen', () => {
    it('lists orders, flags the late one and counts the open ones', async () => {
        await open('/orders')
        expect(screen.getByText(/of 9 orders/)).toBeInTheDocument()
        expect(within(rowOf('ORD-0004')).getByText('Overdue')).toBeInTheDocument()
        expect(within(rowOf('ORD-0006')).getByText('Due today')).toBeInTheDocument()
        expect(within(rowOf('ORD-0001')).getByText('Sale SAL-0012')).toBeInTheDocument()
        expect(await screen.findByText('Open orders')).toBeInTheDocument()
    })

    it('filters to overdue orders', async () => {
        await open('/orders?due=overdue', admin, /of 1 orders/)
        expect(screen.getByText('ORD-0004')).toBeInTheDocument()
        expect(screen.getByLabelText('Filter by timing')).toHaveValue('overdue')
    })

    it('lets staff record an order for a customer', async () => {
        const { user } = await open('/orders', staff)
        const dialog = await openNewOrder(user)
        await choose(user, within(dialog).getByLabelText(/^customer/i), /Aisha Garba/)
        fireEvent.change(within(dialog).getByLabelText(/^needed by/i), { target: { value: day(4) } })
        await choose(user, within(dialog).getByLabelText(/^product 1/i), /Hollow block 6 inch/)
        await user.type(within(dialog).getByLabelText(/^quantity 1/i), '1000')
        await user.click(within(dialog).getByRole('button', { name: 'Record order' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByText('ORD-0010 recorded')).toBeInTheDocument()
    })

    it('will not take an order for a date that has passed', async () => {
        const { user } = await open('/orders')
        const dialog = await openNewOrder(user)
        await choose(user, within(dialog).getByLabelText(/^customer/i), /Aisha Garba/)
        fireEvent.change(within(dialog).getByLabelText(/^needed by/i), { target: { value: day(-2) } })
        await choose(user, within(dialog).getByLabelText(/^product 1/i), /Hollow block 6 inch/)
        await user.type(within(dialog).getByLabelText(/^quantity 1/i), '10')
        await user.click(within(dialog).getByRole('button', { name: 'Record order' }))
        expect(await within(dialog).findByText('The date cannot be in the past')).toBeInTheDocument()
    })

    it('edits an open order and keeps what was already chosen', async () => {
        const { user } = await open('/orders')
        await user.click(screen.getByRole('button', { name: 'View ORD-0005' }))
        const details = await screen.findByRole('dialog', { name: 'ORD-0005' })
        await user.click(within(details).getByRole('button', { name: 'Edit' }))
        const dialog = await screen.findByRole('dialog', { name: 'Edit ORD-0005' })
        await waitFor(() => expect(within(dialog).getByLabelText(/^customer/i)).toHaveDisplayValue(/Danladi Construction Ltd/))
        expect(within(dialog).getByLabelText(/^product 1/i)).toHaveDisplayValue(/Hollow block 6 inch/)
        const quantity = within(dialog).getByLabelText(/^quantity 1/i)
        await user.clear(quantity)
        await user.type(quantity, '250')
        await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(within(rowOf('ORD-0005')).getByText(/250 pcs Hollow block 6 inch/)).toBeInTheDocument()
    })

    it('cancels an open order', async () => {
        const { user } = await open('/orders')
        await user.click(screen.getByRole('button', { name: 'View ORD-0009' }))
        const details = await screen.findByRole('dialog', { name: 'ORD-0009' })
        await user.click(within(details).getByRole('button', { name: 'Cancel order' }))
        const confirm = await screen.findByRole('dialog', { name: 'Cancel this order?' })
        await user.click(within(confirm).getByRole('button', { name: 'Cancel order' }))
        expect(await screen.findByText('ORD-0009 was cancelled')).toBeInTheDocument()
        await waitFor(() => expect(within(rowOf('ORD-0009')).getByText('Cancelled')).toBeInTheDocument())
    })

    it('fulfils an order as a sale for the order’s own customer', async () => {
        const { user } = await open('/orders')
        await user.click(screen.getByRole('button', { name: 'Fulfil ORD-0005' }))
        const dialog = await screen.findByRole('dialog', { name: 'Fulfil ORD-0005' })
        expect(within(dialog).getByText('Danladi Construction Ltd')).toBeInTheDocument()
        expect(within(dialog).queryByLabelText(/^customer/i)).not.toBeInTheDocument()
        await waitFor(() => expect(within(dialog).getByLabelText(/^product 1/i)).toHaveDisplayValue(/Hollow block 6 inch/))
        expect(within(dialog).getByLabelText(/^quantity 1/i)).toHaveValue('200')
        await user.click(within(dialog).getByRole('button', { name: 'Paid in full' }))
        await user.click(within(dialog).getByRole('button', { name: 'Record sale' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByText('SAL-0014 recorded for ₦384,000.00')).toBeInTheDocument()
        await waitFor(() => expect(within(rowOf('ORD-0005')).getByText('Fulfilled')).toBeInTheDocument())
        expect(within(rowOf('ORD-0005')).getByText('Sale SAL-0014')).toBeInTheDocument()
    })

    it('keeps an order open when there is not enough stock to fulfil it', async () => {
        const { user } = await open('/orders')
        await user.click(screen.getByRole('button', { name: 'Fulfil ORD-0007' }))
        const dialog = await screen.findByRole('dialog', { name: 'Fulfil ORD-0007' })
        await waitFor(() => expect(within(dialog).getByLabelText(/^product 1/i)).toHaveDisplayValue(/I-Shape interlock/))
        await user.type(within(dialog).getByLabelText(/^amount received now/i), '0')
        await user.click(within(dialog).getByRole('button', { name: 'Record sale' }))
        expect(await within(dialog).findByText(/^Only .* in stock/)).toBeInTheDocument()
        await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
        await user.click(await screen.findByRole('button', { name: 'Discard' }))
        expect(within(rowOf('ORD-0007')).getByText('Open')).toBeInTheDocument()
    })
})