import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SearchInputProps {
    /** The search that is currently applied. */
    value: string
    onChange: (value: string) => void
    placeholder: string
    /** Read out by screen readers, since the box has no visible label. */
    label: string
    /** How long to wait after typing stops before searching. */
    delayMs?: number
}

/** A search box that waits until typing pauses, so the server is not asked on every key. */
export function SearchInput({ value, onChange, placeholder, label, delayMs = 350 }: SearchInputProps) {
    const [draft, setDraft] = useState(value)
    const [seen, setSeen] = useState(value)
    const [sent, setSent] = useState(value)

    // The search was changed from outside (for example "Clear filters"): show it. A change that is
    // only the echo of what this box sent must not overwrite letters typed since.
    if (value !== seen) {
        setSeen(value)
        if (value !== sent) {
            setSent(value)
            setDraft(value)
        }
    }

    useEffect(() => {
        const text = draft.trim()
        if (text === sent) return
        const timer = setTimeout(() => {
            setSent(text)
            onChange(text)
        }, delayMs)
        return () => clearTimeout(timer)
    }, [draft, sent, onChange, delayMs])

    const sendNow = (text: string) => {
        setSent(text)
        onChange(text)
    }

    return (
        <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
                type="search"
                value={draft}
                aria-label={label}
                placeholder={placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendNow(draft.trim())}
                className="block h-10 w-full rounded-md border border-border-strong bg-surface pr-9 pl-9 text-sm placeholder:text-ink-400 hover:border-ink-400 [&::-webkit-search-cancel-button]:hidden"
            />
            {draft && (
                <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                        setDraft('')
                        sendNow('')
                    }}
                    className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded text-ink-500 hover:text-ink-900"
                >
                    <X className="size-4" aria-hidden />
                </button>
            )}
        </div>
    )
}