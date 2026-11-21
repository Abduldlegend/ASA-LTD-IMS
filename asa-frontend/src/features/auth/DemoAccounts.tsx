import { DEMO_ACCOUNTS } from '../../mocks/authServer'

interface DemoAccountsProps {
    onPick: (email: string, password: string) => void
}

/** Shown only while the mock API is on, so the two roles are easy to try. It is left out of builds that use the real API. */
export default function DemoAccounts({ onPick }: DemoAccountsProps) {
    return (
        <div className="mt-8 rounded-md border border-dashed border-border-strong p-4">
            <p className="text-sm font-medium">Demo accounts</p>
            <p className="mt-0.5 text-xs text-text-muted">The system is using sample data. Pick a role to fill in the form.</p>
            <ul className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0">
                            <span className="block font-medium">{account.role === 'admin' ? 'Management' : 'Staff'}</span>
                            <span className="num block truncate text-xs text-text-muted">
                                {account.email} · {account.password}
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() => onPick(account.email, account.password)}
                            className="h-8 shrink-0 rounded-md border border-border-strong px-3 text-sm hover:bg-ink-50"
                        >
                            Fill in
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}