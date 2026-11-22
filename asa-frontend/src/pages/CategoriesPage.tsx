import { Plus, RotateCw, Tags } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import { canManageCatalog } from '@/config/permissions'
import { CategoryFormModal } from '@/features/products/CategoryFormModal'
import { ProductsTabs } from '@/features/products/ProductParts'
import type { Category } from '@/features/products/types'
import { useCategories, useDeleteCategory } from '@/features/products/useCatalog'
import { KIND_LABELS } from '@/features/products/units'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toApiError } from '@/lib/apiError'

type Dialog = { kind: 'create' } | { kind: 'rename'; category: Category } | { kind: 'delete'; category: Category } | null

export function CategoriesPage() {
    const canManage = canManageCatalog(useCurrentUser().role)
    const query = useCategories()
    const remove = useDeleteCategory()
    const [dialog, setDialog] = useState<Dialog>(null)
    const closeDialog = () => setDialog(null)

    const confirmDelete = async (category: Category) => {
        try {
            await remove.mutateAsync(category.id)
            toast.success(`${category.name} was deleted`)
        } catch (e) {
            // For example: the category still has products.
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    const categories = query.data ?? []
    const deleting = dialog?.kind === 'delete' ? dialog.category : null

    return (
        <>
            <PageHeader
                title="Products"
                description="Blocks, interlocks and cement brands, with prices"
                actions={
                    canManage && (
                        <Button onClick={() => setDialog({ kind: 'create' })}>
                            <Plus className="size-4" aria-hidden /> Add category
                        </Button>
                    )
                }
            />
            <ProductsTabs />

            <Card>
                {query.isPending ? (
                    <div className="space-y-3 p-5" aria-busy>
                        {Array.from({ length: 4 }, (_, i) => (
                            <Skeleton key={i} className="h-5 w-full" />
                        ))}
                    </div>
                ) : query.isError ? (
                    <EmptyState
                        icon={RotateCw}
                        title="The categories could not load"
                        description="Check your connection and try again. Your records are not affected."
                        action={<Button onClick={() => query.refetch()}>Try again</Button>}
                    />
                ) : categories.length === 0 ? (
                    <EmptyState
                        icon={Tags}
                        title="No categories yet"
                        description="Categories group your products, for example hollow blocks or paving interlocks."
                        action={canManage ? <Button onClick={() => setDialog({ kind: 'create' })}>Add category</Button> : undefined}
                    />
                ) : (
                    <ul className="divide-y divide-border">
                        {categories.map((category) => (
                            <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                                <div className="min-w-0">
                                    <p className="font-medium">{category.name}</p>
                                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                                        <Badge tone="neutral">{KIND_LABELS[category.kind]}</Badge>
                                        <span className="num">
                                            {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                                        </span>
                                    </p>
                                </div>
                                {canManage && (
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" onClick={() => setDialog({ kind: 'rename', category })} aria-label={`Rename ${category.name}`}>
                                            Rename
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: 'delete', category })} aria-label={`Delete ${category.name}`}>
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {(dialog?.kind === 'create' || dialog?.kind === 'rename') && (
                <CategoryFormModal category={dialog.kind === 'rename' ? dialog.category : undefined} onClose={closeDialog} />
            )}

            <ConfirmDialog
                open={deleting !== null}
                tone="danger"
                title="Delete this category?"
                confirmLabel="Delete"
                loading={remove.isPending}
                onCancel={closeDialog}
                onConfirm={() => deleting && confirmDelete(deleting)}
            >
                {deleting && <p>{deleting.name} will be removed. A category that still has products cannot be deleted.</p>}
            </ConfirmDialog>
        </>
    )
}