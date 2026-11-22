import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PAGE_SIZES, pageCount } from '@/lib/listParams'
import { pageWindow } from '@/lib/pageWindow'

interface PaginationProps {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    /** What the rows are called, for the "Showing 1 to 20 of 134 users" line. */
    noun: string
}

const pageButton =
    'grid h-8 min-w-8 place-items-center rounded-md px-2 text-sm num transition-colors disabled:cursor-not-allowed disabled:opacity-40'

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, noun }: PaginationProps) {
    const pages = pageCount(total, pageSize)
    const current = Math.min(page, pages)
    const first = (current - 1) * pageSize + 1
    const last = Math.min(current * pageSize, total)

    return (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="num text-sm text-text-muted" aria-live="polite">
                Showing {first} to {last} of {total} {noun}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-text-muted">
                    Rows per page
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="h-8 rounded-md border border-border-strong bg-surface px-2 text-sm text-ink-900"
                    >
                        {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>

                <nav aria-label="Pagination" className="flex items-center gap-1">
                    <button
                        type="button"
                        className={cn(pageButton, 'hover:bg-ink-100')}
                        disabled={current <= 1}
                        onClick={() => onPageChange(current - 1)}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="size-4" aria-hidden />
                    </button>

                    {/* Numbered buttons on wider screens; just "Page 2 of 7" on a phone. */}
                    <span className="num px-2 text-sm sm:hidden">
                        Page {current} of {pages}
                    </span>
                    <div className="hidden items-center gap-1 sm:flex">
                        {pageWindow(current, pages).map((item) =>
                            typeof item === 'number' ? (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => onPageChange(item)}
                                    aria-label={`Page ${item}`}
                                    aria-current={item === current ? 'page' : undefined}
                                    className={cn(pageButton, item === current ? 'bg-ink-900 font-semibold text-white' : 'hover:bg-ink-100')}
                                >
                                    {item}
                                </button>
                            ) : (
                                <span key={item} className="px-1 text-text-muted" aria-hidden>
                                    …
                                </span>
                            ),
                        )}
                    </div>

                    <button
                        type="button"
                        className={cn(pageButton, 'hover:bg-ink-100')}
                        disabled={current >= pages}
                        onClick={() => onPageChange(current + 1)}
                        aria-label="Next page"
                    >
                        <ChevronRight className="size-4" aria-hidden />
                    </button>
                </nav>
            </div>
        </div>
    )
}