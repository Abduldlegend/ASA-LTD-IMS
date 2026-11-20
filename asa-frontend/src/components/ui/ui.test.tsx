import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, Input, StatusBadge } from '@/components/ui'

describe('Button', () => {
  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save changes</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
  it('is disabled and busy while loading', () => {
    render(<Button loading>Save changes</Button>)
    const button = screen.getByRole('button', { name: 'Save changes' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Input', () => {
  it('links the label, marks required fields and shows the error', () => {
    render(<Input label="Phone number" required error="Enter a valid phone number" />)
    const input = screen.getByLabelText(/Phone number/)
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('shows the readable label for a status', () => {
    render(<StatusBadge group="production" status="curing" />)
    expect(screen.getByText('Under curing')).toBeInTheDocument()
  })
  it('falls back to the raw value for unknown statuses', () => {
    render(<StatusBadge group="payment" status="mystery" />)
    expect(screen.getByText('mystery')).toBeInTheDocument()
  })
})
