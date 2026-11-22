import { ChevronDown } from 'lucide-react'

interface FilterSelectProps {
    /** Read out by screen readers, and used for the "all" choice: "All roles". */
    label: string
    /** "" means no filter. */
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
    allLabel: string
}

export function FilterSelect({ label, value, options, onChange, allLabel }: FilterSelectProps) {
    return (
        <div className="relative">
            <select
                aria-label={label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block h-10 appearance-none rounded-md border border-border-strong bg-surface pr-9 pl-3 text-sm hover:border-ink-400"
            >
                <option value="">{allLabel}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
        </div>
    )
}