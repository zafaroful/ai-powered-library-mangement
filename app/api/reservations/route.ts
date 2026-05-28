import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth/server'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select('*, book:books(*), user:users(*)')
    .order('reserved_at', { ascending: false })

  if (user.role === 'student') {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ reservations: data })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { book_id } = await req.json()
  const supabase = createAdminClient()

  const { data: book } = await supabase
    .from('books')
    .select('available_copies, title')
    .eq('id', book_id)
    .single()

  if (!book) {
    return Response.json({ error: 'Book not found' }, { status: 404 })
  }

  if (book.available_copies > 0) {
    return Response.json(
      { error: 'This book is available — use Request to Borrow instead' },
      { status: 400 }
    )
  }

  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_id', book_id)
    .in('status', ['pending', 'ready'])
    .maybeSingle()

  if (existing) {
    return Response.json({ error: 'You already have a reservation for this book' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert({ user_id: user.id, book_id, status: 'pending' })
    .select('*, book:books(*)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ reservation: data }, { status: 201 })
}
