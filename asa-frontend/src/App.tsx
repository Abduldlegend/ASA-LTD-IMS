import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { ALL_NAV_ITEMS } from '@/config/navigation'
import { AppLayout } from '@/layouts/AppLayout'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { StyleGuidePage } from '@/pages/StyleGuidePage'
import { UsersPage } from '@/pages/UsersPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { RawMaterialsPage } from '@/pages/RawMaterialsPage'
import { SuppliersPage } from '@/pages/SuppliersPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { MovementsPage } from '@/pages/MovementsPage'
import { ProductionPage } from '@/pages/ProductionPage'

const BUILT = new Set(['/dashboard', '/users', '/products', '/raw-materials', '/suppliers', '/inventory', '/production'])

const DESCRIPTIONS: Record<string, string> = {
  '/dashboard': 'Sales, expenses, profit and stock at a glance',
  '/inventory': 'Stock levels, movements and adjustments',
  '/products': 'Blocks, interlocks and cement brands, with prices',
  '/raw-materials': 'Cement, sand, granite and water',
  '/production': 'Daily production, curing and rejected products',
  '/purchases': 'Material purchases and approvals',
  '/suppliers': 'Supplier directory and balances',
  '/sales': 'Sales transactions, invoices and receipts',
  '/orders': 'Customer orders and reserved stock',
  '/customers': 'Customer records, history and balances',
  '/deliveries': 'Vehicles, drivers and delivery status',
  '/expenses': 'Expense records and approvals',
  '/employees': 'Daily wages and monthly salaries',
  '/reports': 'Sales, expense, profit and stock reports',
  '/users': 'Staff accounts and roles',
  '/settings': 'System configuration',
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {import.meta.env.DEV && <Route path="/style-guide" element={<StyleGuidePage />} />}

      {/* Everything below needs a signed-in user. Which pages each role may open is decided in config/navigation.ts. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account/password" element={<ChangePasswordPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/categories" element={<CategoriesPage />} />
          <Route path="/raw-materials" element={<RawMaterialsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/movements" element={<MovementsPage />} />
          <Route path="/production" element={<ProductionPage />} />
          {ALL_NAV_ITEMS.filter((item) => !BUILT.has(item.path)).map((item) => (
            <Route
              key={item.path}
              path={`${item.path}/*`}
              element={<ModulePlaceholderPage title={item.label} description={DESCRIPTIONS[item.path] ?? ''} />}
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}