import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface KpiTileProps {
  label: string
  value: string
  note?: ReactNode
  /** Dark tiles use a yellow figure; use for the one number management checks first. */
  emphasis?: boolean
  className?: string
}

export function KpiTile({ label, value, note, emphasis = false, className }: KpiTileProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-5',
        emphasis ? 'border-ink-900 bg-ink-900' : 'border-border bg-surface shadow-card',
        className,
      )}
    >
      <p className={cn('text-sm', emphasis ? 'text-ink-300' : 'text-text-muted')}>{label}</p>
      <p
        className={cn(
          'num mt-1.5 text-2xl font-bold tracking-tight',
          emphasis ? 'text-brand-400' : 'text-ink-900',
        )}
      >
        {value}
      </p>
      {note && <div className={cn('mt-2 text-xs', emphasis ? 'text-ink-300' : 'text-text-muted')}>{note}</div>}
    </div>
  )
}
