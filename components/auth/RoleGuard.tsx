'use client'

import { useUser } from '@/lib/hooks/useUser'
import type { Role } from '@/types'

export function RoleGuard({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const { user, loading } = useUser()

  if (loading) return null
  if (user?.role !== role) return null

  return <>{children}</>
}
