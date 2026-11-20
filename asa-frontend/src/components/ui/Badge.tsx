import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'brand'

const tones: Record<Tone, { badge: string; dot: string }> = {
  success: { badge: 'bg-success-50 text-success-600', dot: 'bg-success-600' },
  danger: { badge: 'bg-danger-50 text-danger-600', dot: 'bg-danger-600' },
  warning: { badge: 'bg-warning-50 text-warning-600', dot: 'bg-warning-600' },
  info: { badge: 'bg-info-50 text-info-600', dot: 'bg-info-600' },
  neutral: { badge: 'bg-ink-100 text-ink-700', dot: 'bg-ink-500' },
  brand: { badge: 'bg-brand-400 text-ink-900', dot: 'bg-ink-900' },
}

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
}

/** Status pill. The label always carries the meaning, colour only reinforces it. */
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone].badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', tones[tone].dot)} aria-hidden />
      {children}
    </span>
  )
}
