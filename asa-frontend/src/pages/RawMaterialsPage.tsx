import { Layers, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, FilterSelect, ListToolbar, SearchInput } from '@/components/data-table'
import { ActiveBadge, Button, ConfirmDialog, PageHeader } from '@/components/ui'
import { canManageProcurement, canViewFinancials } from '@/config/permissions'
import { useRawMaterialColumns } from '@/features/rawMaterials/rawMaterialColumns'
import { RawMaterialFormModal } from '@/features/rawMaterials/RawMaterialFormModal'
import { CostCell, RawMaterialActions, StockCell, ValueCell } from '@/features/rawMaterials/RawMaterialParts'
import type { RawMaterial } from '@/features/rawMaterials/types'
import { MATERIAL_UNITS, UNIT_NAMES } from '@/features/rawMaterials/units'
import { useRawMaterialList, useSetRawMaterialActive } from '@/features/rawMaterials/useRawMaterials'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useListParams } from '@/hooks/useListParams'
import { toApiError } from '@/lib/apiError'
import { hasActiveFilters, type ListSchema } from '@/lib/listParams'

const SCHEMA: ListSchema = {
    sortable: ['name', 'code', 'stock', 'unitCost'],
    filters: { unit: MATERIAL_UNITS, status: ['active', 'inactive'], stock: ['low'] },
    defaultSort: { id: 'name', desc: false },
}

type Dialog = { kind: 'create' } | { kind: 'edit'; material: RawMaterial } | { kind: 'status'; material: RawMaterial } | null

export function RawMaterialsPage() {
    const { role } = useCurrentUser()
    const canManage = canManageProcurement(role)
    const canSeeMoney = canViewFinancials(role)
    const list = useListParams(SCHEMA)
    const { params } = list
    const query = useRawMaterialList(params)
    const setActive = useSetRawMaterialActive()
    const [dialog, setDialog] = useState<Dialog>(null)

    const onEdit = useCallback((material: RawMaterial) => setDialog({ kind: 'edit', material }), [])
    const onToggleActive = useCallback((material: RawMaterial) => setDialog({ kind: 'status', material }), [])
    const columns = useRawMaterialColumns({ onEdit, onToggleActive }, canManage, canSeeMoney)
    const closeDialog = () => setDialog(null)

    const confirmStatus = async (material: RawMaterial) => {
        try {
            await setActive.mutateAsync({ id: material.id, active: !material.active })
            toast.success(material.active ? `${material.name} was deactivated` : `${material.name} was reactivated`)
        } catch (e) {
            toast.error(toApiError(e).message)
        } finally {
            closeDialog()
        }
    }

    const statusTarget = dialog?.kind === 'status' ? dialog.material : null

    return (
        <>
            <PageHeader
                title="Raw materials"
                description="Cement, sand, granite, water and the other things blocks and interlocks are made from"
                actions={
                    canManage && (
                        <Button onClick={() => setDialog({ kind: 'create' })}>
                            <Plus className="size-4" aria-hidden /> Add material
                        </Button>
                    )
                }
            />

            <ListToolbar active={hasActiveFilters(params)} onClear={list.clearAll}>
                <SearchInput label="Search materials" placeholder="Search name or code" value={params.search} onChange={list.setSearch} />
                <FilterSelect
                    label="Filter by unit"
                    allLabel="All units"
                    value={params.filters.unit ?? ''}
                    options={MATERIAL_UNITS.map((u) => ({ value: u, label: `Counted in ${UNIT_NAMES[u].toLowerCase()}` }))}
                    onChange={(v) => list.setFilter('unit', v)}
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
                caption="Raw materials"
                noun="materials"
                columns={columns}
                rows={query.data?.items}
                total={query.data?.total ?? 0}
                params={params}
                getRowId={(material) => material.id}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                onSortChange={list.setSort}
                onClearFilters={list.clearAll}
                isPending={query.isPending}
                isError={query.isError}
                isFetching={query.isFetching}
                onRetry={() => query.refetch()}
                empty={{
                    icon: Layers,
                    title: 'No raw materials yet',
                    description: canManage ? 'Add the materials you use to make blocks and interlocks.' : 'A manager has not added any materials yet.',
                    action: canManage ? <Button onClick={() => setDialog({ kind: 'create' })}>Add material</Button> : undefined,
                }}
                mobileCard={(material) => (
                    <div className="space-y-2.5">
                        <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="num text-xs text-text-muted">{material.code}</p>
                        </div>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-text-muted">In stock</dt>
                                <dd className="mt-0.5 [&>div]:items-start">
                                    <StockCell material={material} />
                                </dd>
                            </div>
                            {canSeeMoney && (
                                <div>
                                    <dt className="text-xs text-text-muted">Cost</dt>
                                    <dd className="mt-0.5 flex flex-col gap-1">
                                        <CostCell material={material} />
                                        <span className="text-xs text-text-muted">
                                            Worth <ValueCell material={material} />
                                        </span>
                                    </dd>
                                </div>
                            )}
                        </dl>
                        <ActiveBadge active={material.active} />
                        {canManage && <RawMaterialActions material={material} onEdit={onEdit} onToggleActive={onToggleActive} />}
                    </div>
                )}
            />

            {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
                <RawMaterialFormModal material={dialog.kind === 'edit' ? dialog.material : undefined} onClose={closeDialog} />
            )}

            <ConfirmDialog
                open={statusTarget !== null}
                tone={statusTarget?.active ? 'danger' : 'primary'}
                title={statusTarget?.active ? 'Deactivate this material?' : 'Reactivate this material?'}
                confirmLabel={statusTarget?.active ? 'Deactivate' : 'Reactivate'}
                loading={setActive.isPending}
                onCancel={closeDialog}
                onConfirm={() => statusTarget && confirmStatus(statusTarget)}
            >
                {statusTarget &&
                    (statusTarget.active ? (
                        <p>{statusTarget.name} will no longer be offered for purchases or production. Its stock and past records stay as they are, and you can reactivate it later.</p>
                    ) : (
                        <p>{statusTarget.name} will be offered for purchases and production again.</p>
                    ))}
            </ConfirmDialog>
        </>
    )
}