import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { controlClass } from './controlClass'
import { Field } from './Field'
import type { ComponentProps } from 'react'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, required, className, ...props }: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <textarea {...a11y} required={required} className={cn(controlClass, 'min-h-24 py-2', className)} {...props} />
      )}
    </Field>
  )
}
