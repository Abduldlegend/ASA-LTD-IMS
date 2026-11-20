import { Navigate, Route, Routes } from 'react-router-dom'
import { ALL_NAV_ITEMS } from '@/config/navigation'
import { AppLayout } from './layouts/AppLayout'
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StyleGuidePage } from '@/pages/StyleGuidePage'

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
      <Route path="/style-guide" element={<StyleGuidePage />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {ALL_NAV_ITEMS.map((item) => (
          <Route
            key={item.path}
            path={`${item.path}/*`}
            element={<ModulePlaceholderPage title={item.label} description={DESCRIPTIONS[item.path] ?? ''} />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}