import { cn } from '@/lib/cn'
import type { DashboardRange } from '@/types/dashboard'
import { PRESET_LABELS, rangeError, type RangePreset } from '../dateRange'

interface DateRangeFilterProps {
    preset: RangePreset
    customRange: DashboardRange
    onPresetChange: (preset: RangePreset) => void
    onCustomRangeChange: (range: DashboardRange) => void
}

const PRESETS: RangePreset[] = ['today', 'week', 'month', 'custom']

export function DateRangeFilter({ preset, customRange, onPresetChange, onCustomRangeChange }: DateRangeFilterProps) {
    const error = preset === 'custom' ? rangeError(customRange) : null

    return (
        <div className="flex flex-col items-start gap-3 sm:items-end">
            <div role="group" aria-label="Date range" className="inline-flex rounded-md border border-border-strong bg-surface p-0.5">
                {PRESETS.map((p) => (
                    <button
                        key={p}
                        type="button"
                        aria-pressed={preset === p}
                        onClick={() => onPresetChange(p)}
                        className={cn(
                            'h-9 rounded px-3 text-sm whitespace-nowrap transition-colors',
                            preset === p ? 'bg-ink-900 font-medium text-white' : 'text-ink-700 hover:bg-ink-100',
                        )}
                    >
                        {PRESET_LABELS[p]}
                    </button>
                ))}
            </div>

            {preset === 'custom' && (
                <div className="flex flex-wrap items-end gap-3">
                    <label className="text-xs text-text-muted">
                        From
                        <input
                            type="date"
                            value={customRange.from}
                            max={customRange.to || undefined}
                            onChange={(e) => onCustomRangeChange({ ...customRange, from: e.target.value })}
                            className="num mt-1 block h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-ink-900"
                        />
                    </label>
                    <label className="text-xs text-text-muted">
                        To
                        <input
                            type="date"
                            value={customRange.to}
                            min={customRange.from || undefined}
                            onChange={(e) => onCustomRangeChange({ ...customRange, to: e.target.value })}
                            className="num mt-1 block h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-ink-900"
                        />
                    </label>
                    {error && (
                        <p role="alert" className="basis-full text-xs text-danger-600">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}