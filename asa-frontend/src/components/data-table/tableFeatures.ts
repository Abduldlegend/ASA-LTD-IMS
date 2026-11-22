import { createColumnHelper, rowPaginationFeature, rowSortingFeature, tableFeatures, type ColumnDef, type RowData } from '@tanstack/react-table'

/** What a column can say about how it looks, beyond what TanStack Table knows. */
export interface ListColumnMeta {
    /** Numbers and money line up on the right. */
    align?: 'right'
    /** Extra classes for the header and body cells, for example a fixed width. */
    className?: string
    /** Name shown beside the value in the phone layout when there is no custom card. */
    mobileLabel?: string
}

/**
 * Every list in the app uses the same two table features. Sorting and paging are done by the
 * server, so the table only holds the state and draws the rows it is given.
 */
export const listFeatures = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    columnMeta: {} as ListColumnMeta,
})

export type ListColumn<T extends RowData> = ColumnDef<typeof listFeatures, T>

/** Use as `const col = listColumns<User>()` then `col.accessor('name', { header: 'Name' })`. */
export const listColumns = <T extends RowData>() => createColumnHelper<typeof listFeatures, T>()