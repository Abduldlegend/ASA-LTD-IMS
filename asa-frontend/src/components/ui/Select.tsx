import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { controlClass } from './controlClass'
import { Field } from './Field'

interface Option {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  options: Option[]
  placeholder?: string
  hint?: string
  error?: string
}

export function Select({ label, options, placeholder, hint, error, required, className, ...props }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <div className="relative">
          <select
            {...a11y}
            required={required}
            className={cn(controlClass, 'h-10 appearance-none pr-9', className)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden
          />
        </div>
      )}
    </Field>
  )
}
