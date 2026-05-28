import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/types'

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (user) return user

  try {
    const admin = createAdminClient()
    const { data: byId } = await admin
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (byId) return byId

    if (session.user.email) {
      const { data: byEmail } = await admin
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle()
      return byEmail
    }
  } catch {
    // ignore
  }

  return null
}

export async function requireRole(role: Role) {
  const user = await getSessionUser()
  if (!user || user.role !== role) {
    return null
  }
  return user
}
