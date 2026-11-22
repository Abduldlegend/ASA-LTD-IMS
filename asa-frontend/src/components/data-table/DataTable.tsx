import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCw, SearchX, type LucideIcon } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useTable, type RowData } from '@tanstack/react-table'
import { Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import { hasActiveFilters, pageCount, type ListParams, type SortState } from '@/lib/listParams'
import { Pagination } from './Pagination'
import { listFeatures, type ListColumn } from './tableFeatures'

interface DataTableProps<T extends RowData> {
    /** Read out by screen readers as the name of the table. */
    caption: string
    /** The plural name of the rows, for the footer: "users". */
    noun: string
    columns: ListColumn<T>[]
    /** The rows of the current page, exactly as the server sent them. */
    rows: T[] | undefined
    /** How many rows match in total, across all pages. */
    total: number
    params: ListParams
    getRowId: (row: T) => string
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    onSortChange: (sort: SortState | null) => void
    onClearFilters: () => void
    /** From the data hook. */
    isPending: boolean
    isError: boolean
    isFetching: boolean
    onRetry: () => void
    /** Shown when there are no rows and nothing is filtered, for example "No users yet". */
    empty: { icon: LucideIcon; title: string; description: string; action?: ReactNode }
    /** How a row looks on a phone. Without it, each row becomes a short list of label and value. */
    mobileCard?: (row: T) => ReactNode
}

const EMPTY: never[] = []
const SKELETON_ROWS = 6

export function DataTable<T extends RowData>({
    caption,
    noun,
    columns,
    rows,
    total,
    params,
    getRowId,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onClearFilters,
    isPending,
    isError,
    isFetching,
    onRetry,
    empty,
    mobileCard,
}: DataTableProps<T>) {
    const isWide = useMediaQuery('(min-width: 768px)')
    const data = (rows ?? EMPTY) as T[]

    const table = useTable({
        features: listFeatures,
        columns,
        data,
        getRowId,
        rowCount: total,
        manualPagination: true,
        manualSorting: true,
        state: {
            pagination: { pageIndex: params.page - 1, pageSize: params.pageSize },
            sorting: params.sort ? [params.sort] : [],
        },
        onPaginationChange: (updater) => {
            const before = { pageIndex: params.page - 1, pageSize: params.pageSize }
            const after = typeof updater === 'function' ? updater(before) : updater
            if (after.pageSize !== before.pageSize) onPageSizeChange(after.pageSize)
            else if (after.pageIndex !== before.pageIndex) onPageChange(after.pageIndex + 1)
        },
        onSortingChange: (updater) => {
            const before = params.sort ? [params.sort] : []
            const after = typeof updater === 'function' ? updater(before) : updater
            onSortChange(after[0] ?? null)
        },
    })

    // If the last row of the last page goes away, step back to the page that now ends the list.
    const lastPage = pageCount(total, params.pageSize)
    useEffect(() => {
        if (!isFetching && !isPending && data.length === 0 && total > 0 && params.page > lastPage) onPageChange(lastPage)
    }, [isFetching, isPending, data.length, total, params.page, lastPage, onPageChange])

    const filtered = hasActiveFilters(params)
    const columnCount = table.getAllLeafColumns().length
    const layout = isWide ? 'table' : mobileCard ? 'cards' : 'stack'

    if (isError && !rows) {
        return (
            <Card>
                <EmptyState
                    icon={RotateCw}
                    title={`The ${noun} could not load`}
                    description="Check your connection and try again. Your records are not affected."
                    action={<Button onClick={onRetry}>Try again</Button>}
                />
            </Card>
        )
    }

    if (!isPending && total === 0) {
        return (
            <Card>
                {filtered ? (
                    <EmptyState
                        icon={SearchX}
                        title={`No ${noun} match`}
                        description="Nothing fits the search and filters you chose. Try different words, or clear them to see everything."
                        action={
                            <Button variant="outline" onClick={onClearFilters}>
                                Clear search and filters
                            </Button>
                        }
                    />
                ) : (
                    <EmptyState {...empty} />
                )}
            </Card>
        )
    }

    const dim = isFetching && !isPending ? 'opacity-60 transition-opacity' : 'transition-opacity'

    return (
        <Card className="overflow-hidden">
            {layout === 'table' ? (
                <div className={cn('overflow-x-auto', dim)} aria-busy={isFetching}>
                    <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">{caption}</caption>
                        <thead className="bg-ink-50">
                            {table.getHeaderGroups().map((group) => (
                                <tr key={group.id}>
                                    {group.headers.map((header) => {
                                        const meta = header.column.columnDef.meta
                                        const sorted = header.column.getIsSorted()
                                        const canSort = header.column.getCanSort()
                                        return (
                                            <th
                                                key={header.id}
                                                scope="col"
                                                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : canSort ? 'none' : undefined}
                                                className={cn(
                                                    'border-b border-border px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-600 uppercase',
                                                    meta?.align === 'right' && 'text-right',
                                                    meta?.className,
                                                )}
                                            >
                                                {header.isPlaceholder ? null : canSort ? (
                                                    <button
                                                        type="button"
                                                        // Not sorted -> ascending -> descending -> ascending. A list is never left unsorted.
                                                        onClick={() => onSortChange({ id: header.column.id, desc: sorted === 'asc' })}
                                                        className={cn(
                                                            '-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase hover:text-ink-900',
                                                            meta?.align === 'right' && 'flex-row-reverse',
                                                        )}
                                                    >
                                                        <table.FlexRender header={header} />
                                                        {sorted === 'asc' ? (
                                                            <ArrowUp className="size-3.5" aria-hidden />
                                                        ) : sorted === 'desc' ? (
                                                            <ArrowDown className="size-3.5" aria-hidden />
                                                        ) : (
                                                            <ChevronsUpDown className="size-3.5 text-ink-400" aria-hidden />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <table.FlexRender header={header} />
                                                )}
                                            </th>
                                        )
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {isPending
                                ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                                    <tr key={i} className="border-b border-border last:border-0">
                                        {Array.from({ length: columnCount }, (_, c) => (
                                            <td key={c} className="px-4 py-3.5">
                                                <Skeleton className="h-4 w-full max-w-40" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                                : table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-ink-50/60">
                                        {row.getAllCells().map((cell) => {
                                            const meta = cell.column.columnDef.meta
                                            return (
                                                <td
                                                    key={cell.id}
                                                    className={cn('px-4 py-3 align-middle', meta?.align === 'right' && 'num text-right', meta?.className)}
                                                >
                                                    <table.FlexRender cell={cell} />
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <ul className={cn('divide-y divide-border', dim)} aria-label={caption} aria-busy={isFetching}>
                    {isPending
                        ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                            <li key={i} className="space-y-2 p-4">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </li>
                        ))
                        : layout === 'cards'
                            ? data.map((row) => (
                                <li key={getRowId(row)} className="p-4">
                                    {mobileCard!(row)}
                                </li>
                            ))
                            : // A phone with no custom card: each row becomes a short list of label and value.
                            table.getRowModel().rows.map((row) => (
                                <li key={row.id} className="space-y-1.5 p-4">
                                    {row.getAllCells().map((cell) => {
                                        const def = cell.column.columnDef
                                        const label = def.meta?.mobileLabel ?? (typeof def.header === 'string' ? def.header : '')
                                        return (
                                            <div key={cell.id} className="flex items-start justify-between gap-4 text-sm">
                                                {label && <span className="text-text-muted">{label}</span>}
                                                <span className="min-w-0 text-right">
                                                    <table.FlexRender cell={cell} />
                                                </span>
                                            </div>
                                        )
                                    })}
                                </li>
                            ))}
                </ul>
            )}

            {!isPending && (
                <Pagination
                    page={params.page}
                    pageSize={params.pageSize}
                    total={total}
                    noun={noun}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                />
            )}
        </Card>
    )
}