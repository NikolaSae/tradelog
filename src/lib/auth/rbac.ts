//src/lib/auth/rbac.ts
import { headers } from 'next/headers'
import { auth } from './index'

export type UserRole = 'user' | 'admin' | 'super_admin'

export async function requireRole(minRole: UserRole = 'admin') {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) throw new Error('Unauthorized')

  const userRole = ((session.user as any).role ?? 'user') as UserRole
  const hierarchy: UserRole[] = ['user', 'admin', 'super_admin']

  if (hierarchy.indexOf(userRole) < hierarchy.indexOf(minRole)) {
    throw new Error('Forbidden')
  }

  return session
}

export async function isAdmin(): Promise<boolean> {
  try {
    await requireRole('admin')
    return true
  } catch {
    return false
  }
}