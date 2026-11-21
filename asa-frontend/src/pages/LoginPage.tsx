import { zodResolver } from '@hookform/resolvers/zod'
import { Info, TriangleAlert } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import { Button, FullPageLoader, Input, PasswordInput } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { toApiError } from '@/lib/apiError'

// Only exists in builds that use the mock API, so demo accounts never ship with the real one.
const DemoAccounts = __USE_MOCKS__ ? lazy(() => import('@/features/auth/DemoAccounts')) : null

/** Only paths inside this app are accepted as a place to return to after signing in. */
function returnPath(from: unknown): string {
    if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.startsWith('/login')) {
        return '/dashboard'
    }
    return from
}

const FIELDS: (keyof LoginValues)[] = ['email', 'password']

export function LoginPage() {
    const { status, sessionEnd, login } = useAuth()
    const location = useLocation()
    const [formError, setFormError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setError,
        setValue,
        setFocus,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    if (status === 'loading') return <FullPageLoader label="Checking your session" />
    if (status === 'authenticated') {
        return <Navigate to={returnPath((location.state as { from?: string } | null)?.from)} replace />
    }

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null)
        try {
            await login(values)
        } catch (e) {
            const error = toApiError(e)
            const fieldMessages = Object.entries(error.fieldErrors ?? {}).filter(([field]) =>
                (FIELDS as string[]).includes(field),
            )
            if (fieldMessages.length > 0) {
                for (const [field, message] of fieldMessages) setError(field as keyof LoginValues, { message })
            } else {
                setFormError(error.message)
            }
            if (error.status === 401) {
                setValue('password', '')
                setFocus('password')
            }
        }
    })

    return (
        <div className="grid min-h-screen lg:grid-cols-[5fr_6fr]">
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
                {/* A running-bond block pattern, drawn as faint lines. */}
                <svg className="absolute inset-0 size-full" aria-hidden>
                    <defs>
                        <pattern id="blocks" width="96" height="56" patternUnits="userSpaceOnUse">
                            <path d="M0 0H96M0 28H96M0 0V28M48 28V56" fill="none" stroke="#262626" strokeWidth="1.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#blocks)" />
                </svg>
                <div className="relative flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-md bg-brand-400 text-xl font-extrabold text-ink-900">A</span>
                    <span className="text-lg font-bold tracking-tight">ASA LTD</span>
                </div>
                <div className="relative max-w-md">
                    <h2 className="text-3xl leading-tight">Stock, production and accounts in one place</h2>
                    <p className="mt-4 text-ink-300">
                        Track what was made, what is still curing, what was sold, and who still owes you.
                    </p>
                </div>
                <p className="relative text-sm text-ink-400">Blocks, interlocks and cement</p>
            </aside>

            <main className="flex flex-col bg-surface">
                <div className="flex items-center gap-3 bg-ink-900 px-6 py-4 text-white lg:hidden">
                    <span className="grid size-8 place-items-center rounded-md bg-brand-400 font-extrabold text-ink-900">A</span>
                    <span className="font-bold tracking-tight">ASA LTD</span>
                </div>

                <div className="flex flex-1 items-center justify-center px-6 py-10">
                    <div className="w-full max-w-sm">
                        <h1 className="text-2xl">Sign in</h1>
                        <p className="mt-1 text-sm text-text-muted">Use the email and password your manager gave you.</p>

                        {sessionEnd === 'expired' && (
                            <div role="status" className="mt-6 flex gap-2.5 rounded-md bg-info-50 p-3 text-sm text-info-600">
                                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                                Your session ended, so you were signed out. Sign in again to carry on where you were.
                            </div>
                        )}

                        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
                            {formError && (
                                <div role="alert" className="flex gap-2.5 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
                                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                                    {formError}
                                </div>
                            )}
                            <Input
                                label="Email address"
                                type="email"
                                autoComplete="username"
                                placeholder="you@asaltd.com"
                                autoFocus
                                required
                                error={errors.email?.message}
                                {...register('email')}
                            />
                            <PasswordInput
                                label="Password"
                                autoComplete="current-password"
                                required
                                error={errors.password?.message}
                                {...register('password')}
                            />
                            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                                {isSubmitting ? 'Signing in' : 'Sign in'}
                            </Button>
                        </form>

                        {DemoAccounts && (
                            <Suspense fallback={null}>
                                <DemoAccounts
                                    onPick={(email, password) => {
                                        setFormError(null)
                                        setValue('email', email, { shouldValidate: true })
                                        setValue('password', password, { shouldValidate: true })
                                    }}
                                />
                            </Suspense>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}