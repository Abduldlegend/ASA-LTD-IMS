import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => ReactNode
}

/** Label, control, hint and inline error, laid out the same way on every form. */
export function Field({ label, required, hint, error, className, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const hasMessage = Boolean(error || hint)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span className="ml-0.5 text-danger-600" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': hasMessage ? messageId : undefined,
      })}
      {hasMessage && (
        <p id={messageId} className={cn('text-xs', error ? 'text-danger-600' : 'text-text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
