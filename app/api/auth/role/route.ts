import { createClient } from '@/lib/supabase/server'
import { getRoleForUser } from '@/lib/auth/role'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return Response.json({ role: null })
  }

  const role = await getRoleForUser(
    supabase,
    session.user.id,
    session.user.email
  )

  return Response.json({ role })
}
