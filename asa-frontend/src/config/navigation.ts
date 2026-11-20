import {
    BarChart3,
    Boxes,
    ClipboardList,
    ContactRound,
    Factory,
    Layers,
    LayoutDashboard,
    type LucideIcon,
    Package,
    Receipt,
    Settings,
    ShoppingCart,
    Truck,
    UserCog,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react'
import type { Role } from '@/types/user'

export interface NavItem {
    label: string
    path: string
    icon: LucideIcon
    /** Roles that can see this item. Leave out for everyone. */
    roles?: Role[]
}

export interface NavGroup {
    id: string
    /** Groups without a label render their items directly, with no heading. */
    label?: string
    items: NavItem[]
}

const management: Role[] = ['admin']

export const NAV_GROUPS: NavGroup[] = [
    {
        id: 'overview',
        items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
    },
    {
        id: 'operations',
        label: 'Operations',
        items: [
            { label: 'Inventory', path: '/inventory', icon: Warehouse },
            { label: 'Products', path: '/products', icon: Package },
            { label: 'Raw materials', path: '/raw-materials', icon: Layers },
            { label: 'Production', path: '/production', icon: Factory },
        ],
    },
    {
        id: 'trade',
        label: 'Trade',
        items: [
            { label: 'Purchases', path: '/purchases', icon: ShoppingCart },
            { label: 'Suppliers', path: '/suppliers', icon: Boxes },
            { label: 'Sales', path: '/sales', icon: Receipt },
            { label: 'Orders', path: '/orders', icon: ClipboardList },
            { label: 'Customers', path: '/customers', icon: Users },
            { label: 'Deliveries', path: '/deliveries', icon: Truck },
        ],
    },
    {
        id: 'finance',
        label: 'Finance',
        items: [
            { label: 'Expenses', path: '/expenses', icon: Wallet, roles: management },
            { label: 'Employees', path: '/employees', icon: ContactRound, roles: management },
            { label: 'Financial reports', path: '/reports', icon: BarChart3, roles: management },
        ],
    },
    {
        id: 'administration',
        label: 'Administration',
        items: [
            { label: 'User management', path: '/users', icon: UserCog, roles: management },
            { label: 'Settings', path: '/settings', icon: Settings, roles: management },
        ],
    },
]

/** Navigation the given role is allowed to see; groups with no visible items are dropped. */
export function navForRole(role: Role): NavGroup[] {
    return NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    })).filter((group) => group.items.length > 0)
}

export function findNavItem(pathname: string): { group: NavGroup; item: NavItem } | undefined {
    for (const group of NAV_GROUPS) {
        const item = group.items.find((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
        if (item) return { group, item }
    }
    return undefined
}

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)