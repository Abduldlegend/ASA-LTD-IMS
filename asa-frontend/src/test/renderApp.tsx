import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { DEMO_ACCOUNTS } from '@/mocks/authServer'
import { Toaster } from 'sonner'
// ...


export const admin = DEMO_ACCOUNTS[0]
export const staff = DEMO_ACCOUNTS[1]

/** Renders the whole app at a given address, with the real auth provider and the mock API. */
export function renderApp(initialPath = '/') {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const user = userEvent.setup()
    const utils = render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[initialPath]}>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </MemoryRouter>
            <Toaster />
        </QueryClientProvider>,
    )
    return { user, ...utils }
}

export async function signIn(
    user: ReturnType<typeof userEvent.setup>,
    screen: typeof import('@testing-library/react').screen,
    account: { email: string; password: string },
) {
    await user.type(await screen.findByLabelText(/email address/i), account.email)
    await user.type(screen.getByLabelText(/^password/i), account.password)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
}