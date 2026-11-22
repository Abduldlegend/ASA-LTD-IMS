import { NavLink } from 'react-router-dom'
import { Badge, Button, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Product } from './types'
import { describePrice, describeStock, needsRate, stockState } from './units'

export function ActiveBadge({ product }: { product: Product }) {
    return <Badge tone={product.active ? 'success' : 'neutral'}>{product.active ? 'Active' : 'Inactive'}</Badge>
}

/** The stock figure, with a badge when it is low or gone. Interlocks also show the area the pieces cover. */
export function StockCell({ product }: { product: Product }) {
    const state = stockState(product)
    return (
        <div className="flex flex-col items-end gap-1">
            <span className="num">{describeStock(product)}</span>
            {state !== 'ok' && <StatusBadge group="stock" status={state} />}
        </div>
    )
}

export function PriceCell({ product }: { product: Product }) {
    return (
        <div className="flex flex-col items-end gap-1">
            <span className="num">{describePrice(product)}</span>
            {/* An interlock with no rate cannot be sold in m² until someone sets one. */}
            {needsRate(product) && <Badge tone="warning">No m² rate yet</Badge>}
        </div>
    )
}

export interface ProductActionHandlers {
    onEdit: (product: Product) => void
    onToggleActive: (product: Product) => void
}

export function ProductActions({ product, onEdit, onToggleActive }: ProductActionHandlers & { product: Product }) {
    return (
        <div className="flex justify-end gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}>
                Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onToggleActive(product)} aria-label={`${product.active ? 'Deactivate' : 'Reactivate'} ${product.name}`}>
                {product.active ? 'Deactivate' : 'Reactivate'}
            </Button>
        </div>
    )
}

/** Switches between the two product screens. */
export function ProductsTabs() {
    const tab = ({ isActive }: { isActive: boolean }) =>
        cn(
            '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            isActive ? 'border-ink-900 text-ink-900' : 'border-transparent text-text-muted hover:text-ink-900',
        )
    return (
        <nav aria-label="Product sections" className="mb-5 flex gap-1 border-b border-border">
            <NavLink to="/products" end className={tab}>
                Products
            </NavLink>
            <NavLink to="/products/categories" className={tab}>
                Categories
            </NavLink>
        </nav>
    )
}