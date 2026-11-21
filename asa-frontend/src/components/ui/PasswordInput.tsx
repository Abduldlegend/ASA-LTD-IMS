import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { controlClass } from './controlClass'
import { Field } from './Field'

interface PasswordInputProps extends Omit<ComponentProps<'input'>, 'id' | 'type'> {
  label: string
  hint?: string
  error?: string
}

/** A password field with a button to show what has been typed. */
export function PasswordInput({ label, hint, error, required, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <div className="relative">
          <input
            {...a11y}
            required={required}
            type={visible ? 'text' : 'password'}
            className={cn(controlClass, 'h-10 pr-11', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-ink-500 hover:text-ink-900"
          >
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      )}
    </Field>
  )
}