import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDueDate } from '@/lib/utils/dates'
import { getLibrarySettings } from '@/lib/library/settings'
import { formatSupabaseError } from '@/lib/utils/supabase-errors'
import { getSessionUser } from '@/lib/auth/server'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  let query = supabase
    .from('loans')
    .select('*, book:books(*), user:users(*)')
    .order('borrowed_at', { ascending: false })

  if (user.role === 'student') {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: formatSupabaseError(error.message) }, { status: 500 })
  return Response.json({ loans: data })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { book_id, user_id } = await req.json()
  const isAdminIssue = user.role === 'admin' && user_id && user_id !== user.id
  const targetUserId = isAdminIssue ? user_id : user.id

  const supabase = createAdminClient()

  const { data: book } = await supabase
    .from('books')
    .select('available_copies')
    .eq('id', book_id)
    .single()

  if (!book || book.available_copies < 1) {
    return Response.json({ error: 'Book not available' }, { status: 400 })
  }

  if (!isAdminIssue) {
    const { data: existingPending } = await supabase
      .from('loans')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('book_id', book_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return Response.json({ error: 'You already have a pending request for this book' }, { status: 400 })
    }
  }

  const now = new Date()
  const settings = await getLibrarySettings()

  if (isAdminIssue) {
    const { data: loan, error } = await supabase
      .from('loans')
      .insert({
        user_id: targetUserId,
        book_id,
        status: 'active',
        borrowed_at: now.toISOString(),
        due_date: getDueDate(now, settings.default_loan_days).toISOString(),
      })
      .select('*, book:books(*)')
      .single()

    if (error) return Response.json({ error: formatSupabaseError(error.message) }, { status: 500 })

    await supabase
      .from('books')
      .update({ available_copies: book.available_copies - 1 })
      .eq('id', book_id)

    return Response.json({ loan }, { status: 201 })
  }

  const { data: loan, error } = await supabase
    .from('loans')
    .insert({
      user_id: targetUserId,
      book_id,
      status: 'pending',
      borrowed_at: null,
      due_date: null,
    })
    .select('*, book:books(*)')
    .single()

  if (error) return Response.json({ error: formatSupabaseError(error.message) }, { status: 500 })

  await supabase
    .from('books')
    .update({ available_copies: book.available_copies - 1 })
    .eq('id', book_id)

  return Response.json({ loan }, { status: 201 })
}
