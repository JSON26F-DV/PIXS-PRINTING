import type { RoleType } from '../context/AuthContext'

/** Dashboard path from `customers.role` or `employees.role`. */
export function getHomePathForRole(role: RoleType | string | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'staff':
    case 'technician':
      return '/staff/overview'
    case 'inventory':
      return '/inventory/overview'
    case 'customer':
      return '/homepage'
    default:
      return '/homepage'
  }
}

export function normalizeRole(
  role: string | undefined | null,
  accountType: 'customer' | 'employee' | 'guest',
): RoleType {
  if (role) return role as RoleType
  if (accountType === 'customer') return 'customer'
  if (accountType === 'employee') return 'staff'
  return 'guest'
}

