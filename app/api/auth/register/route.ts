import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Server-side registration — creates a confirmed user without sending auth emails.
 * Avoids Supabase built-in SMTP rate limits (~2–3 emails/hour on free tier).
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, matric_no } = await req.json()

    if (!email || !password || !full_name) {
      return Response.json(
        { error: 'Email, password, and full name are required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, matric_no: matric_no ?? null },
    })

    if (authError) {
      const message =
        authError.message.includes('already been registered') ||
        authError.message.includes('already exists')
          ? 'An account with this email already exists. Try signing in instead.'
          : authError.message

      return Response.json({ error: message }, { status: 400 })
    }

    if (!authData.user) {
      return Response.json({ error: 'Failed to create account.' }, { status: 500 })
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name,
      matric_no: matric_no || null,
      role: 'student',
    })

    if (profileError) {
      // Roll back auth user if profile insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return Response.json({ error: profileError.message }, { status: 500 })
    }

    return Response.json({ success: true, userId: authData.user.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return Response.json(
        {
          error:
            'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env and restart the dev server.',
        },
        { status: 503 }
      )
    }
    return Response.json({ error: message }, { status: 500 })
  }
}
