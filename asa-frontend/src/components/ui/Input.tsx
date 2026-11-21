import { cn } from '@/lib/cn'
import { controlClass } from './controlClass'
import { Field } from './Field'
import type { ComponentProps } from 'react'

interface InputProps extends Omit<ComponentProps<'input'>, 'id'> {
    label: string
    hint?: string
    error?: string
}

export function Input({ label, hint, error, required, className, ...props }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <input
          {...a11y}
          required={required}
          className={cn(controlClass, 'h-10', props.type === 'number' && 'num', className)}
          {...props}
        />
      )}
    </Field>
  )
}
