import { Package, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { Button, ConfirmDialog, PageHeader } from '@/components/ui'
import { canManageCatalog } from '@/config/permissions'
import { useProductColumns } from '@/features/products/productColumns'
import { ProductFormModal } from '@/features/products/ProductFormModal'
import { ActiveBadge, PriceCell, ProductActions, ProductsTabs, StockCell } from '@/features/products/ProductParts'
import type { Product } from '@/features/products/types'
import { useProductList, useSetProductActive } from '@/features/products/useCatalog'
import { KIND_LABELS, KIND_PLURALS, KINDS } from '@/features/products/units'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { toApiError } from '@/lib/apiError'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['name', 'categoryName', 'price', 'stock'],
    filters: { kind: KINDS, status: ['active', 'inactive'], stock: ['low'] },
    defaultSort: { id: 'name', desc: false },
}

type Dialog = { kind: 'create' } | { kind: 'edit'; product: Product } | { kind: 'status'; product: Product } | null

export function ProductsPage() {
    const canManage = canManageCatalog(useCurrentUser().role)
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useProductList(params)
    const setActive = useSetProductActive()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onEdit = useCallback((product: Product) => setDialog({ kind: 'edit', product }), [])
    const onToggleActive = useCallback((product: Product) => setDialog({ kind: 'status', product }), [])
    const columns = useProductColumns({ onEdit, onToggleActive }, canManage)

    const closeDialog = () => setDialog(null)
    const confirmStatus = async (product: Product) => {
        try {
            await setActive.mutateAsync({ id: product.id, active: !product.active })
            toast.success(product.active ? `${product.name} was deactivated` : `${product.name} was reactivated`)
        } catch (e) {
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    const statusTarget = dialog?.kind === 'status' ? dialog.product : null

    return (
        <>
            <PageHeader
                title="Products"
                description="Blocks, interlocks and cement brands, with prices"
                actions={
                    canManage && (
                        <Button onClick={() => setDialog({ kind: 'create' })}>
                            <Plus className="size-4" aria-hidden /> Add product
                        </Button>
                    )
                }
            />
            <ProductsTabs />

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search products" placeholder="Search name, code or category" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by type"
                    allLabel="All types"
                    value={params.filters.kind ?? ''}
                    options={KINDS.map((k) => ({ value: k, label: KIND_PLURALS[k] }))}
                    onChange={(v) => list.setFilter('kind', v)}
                />
                <FilterSelect
                    label="Filter by stock"
                    allLabel="Any stock level"
                    value={params.filters.stock ?? ''}
                    options={[{ value: 'low', label: 'Low or out of stock' }]}
                    onChange={(v) => list.setFilter('stock', v)}
                />
                <FilterSelect
                    label="Filter by status"
                    allLabel="All statuses"
                    value={params.filters.status ?? ''}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                    ]}
                    onChange={(v) => list.setFilter('status', v)}
                />
            </ListToolbar>

            <DataTable
                caption="Products"
                noun="products"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(product) => product.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: Package,
                    title: 'No products yet',
                    description: canManage ? 'Add the blocks, interlocks and cement you make or sell.' : 'A manager has not added any products yet.',
                    action: canManage ? <Button onClick={() => setDialog({ kind: 'create' })}>Add product</Button> : undefined,
                }}
                mobileCard={(product) => (
                    <div className="space-y-2.5">
                        <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-text-muted">
                                <span className="num">{product.code}</span> · {product.categoryName} · {KIND_LABELS[product.kind]}
                            </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-text-muted">Price</dt>
                                <dd className="mt-0.5 [&>div]:items-start">
                                    <PriceCell product={product} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-text-muted">In stock</dt>
                                <dd className="mt-0.5 [&>div]:items-start">
                                    <StockCell product={product} />
                                </dd>
                            </div>
                        </dl>
                        <ActiveBadge product={product} />
                        {canManage && <ProductActions product={product} onEdit={onEdit} onToggleActive={onToggleActive} />}
                    </div>
                )}
            />

            {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
                <ProductFormModal product={dialog.kind === 'edit' ? dialog.product : undefined} onClose={closeDialog} />
            )}

            <ConfirmDialog
                open={statusTarget !== null}
                tone={statusTarget?.active ? 'danger' : 'primary'}
                title={statusTarget?.active ? 'Deactivate this product?' : 'Reactivate this product?'}
                confirmLabel={statusTarget?.active ? 'Deactivate' : 'Reactivate'}
                loading={setActive.isPending}
                onCancel={closeDialog}
                onConfirm={() => statusTarget && confirmStatus(statusTarget)}
            >
                {statusTarget &&
                    (statusTarget.active ? (
                        <p>
                            {statusTarget.name} will no longer be offered for new sales or production. Its stock and past records stay as they are, and you can reactivate it later.
                        </p>
                    ) : (
                        <p>{statusTarget.name} will be offered for sales and production again.</p>
                    ))}
            </ConfirmDialog>
        </>
    )
}