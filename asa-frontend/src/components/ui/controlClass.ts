import { cn } from '@/lib/cn'

/** Shared look for text inputs, selects and textareas. */
export const controlClass = cn(
  'block w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-ink-900',
  'placeholder:text-ink-400 transition-colors',
  'hover:border-ink-400 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500',
  'aria-[invalid=true]:border-danger-600',
)
