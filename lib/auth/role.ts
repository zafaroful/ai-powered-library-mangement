import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/types'

function parseRole(value: unknown): Role | null {
  if (value === 'admin' || value === 'student') return value
  return null
}

/**
 * Resolve role from public.users — uses service role if RLS blocks the anon client.
 */
export async function getRoleForUser(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<Role | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  const role = parseRole(data?.role)
  if (role) return role

  try {
    const admin = createAdminClient()

    const { data: byId } = await admin
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    const roleById = parseRole(byId?.role)
    if (roleById) return roleById

    if (email) {
      const { data: byEmail } = await admin
        .from('users')
        .select('role, id')
        .eq('email', email)
        .maybeSingle()

      const roleByEmail = parseRole(byEmail?.role)
      if (roleByEmail) return roleByEmail
    }
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY not set
  }

  return null
}

export function homePathForRole(role: Role | null): '/admin' | '/student' {
  return role === 'admin' ? '/admin' : '/student'
}
