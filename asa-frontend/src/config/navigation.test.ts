import { findNavItem, navForRole } from './navigation'

const labels = (role: 'admin' | 'staff') => navForRole(role).flatMap((g) => g.items.map((i) => i.label))

describe('navigation', () => {
    it('shows management everything', () => {
        expect(labels('admin')).toEqual(expect.arrayContaining(['Expenses', 'Financial reports', 'User management', 'Settings']))
    })
    it('hides finance and administration items from staff', () => {
        const staff = labels('staff')
        expect(staff).toContain('Sales')
        expect(staff).toContain('Production')
        for (const hidden of ['Expenses', 'Employees', 'Financial reports', 'User management', 'Settings']) {
            expect(staff).not.toContain(hidden)
        }
    })
    it('drops groups that have no visible items', () => {
        const ids = navForRole('staff').map((g) => g.id)
        expect(ids).not.toContain('finance')
        expect(ids).not.toContain('administration')
    })
    it('finds the current item for nested paths', () => {
        expect(findNavItem('/sales/new')?.item.label).toBe('Sales')
        expect(findNavItem('/nope')).toBeUndefined()
    })
})