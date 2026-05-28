import { createAdminClient } from '@/lib/supabase/admin'
import { calculateFine } from '@/lib/utils/fines'
import { getSessionUser } from '@/lib/auth/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: loan } = await supabase
    .from('loans')
    .select('*, book:books(*)')
    .eq('id', id)
    .single()

  if (!loan) return Response.json({ error: 'Loan not found' }, { status: 404 })
  if (loan.status !== 'active') {
    return Response.json({ error: 'Only active loans can be returned' }, { status: 400 })
  }
  if (loan.returned_at) return Response.json({ error: 'Already returned' }, { status: 400 })

  if (user.role === 'student' && loan.user_id !== user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const returnedAt = new Date().toISOString()
  const fineAmount = loan.due_date
    ? calculateFine(loan.due_date, returnedAt)
    : 0

  const { data: updated, error } = await supabase
    .from('loans')
    .update({ returned_at: returnedAt, fine_amount: fineAmount })
    .eq('id', id)
    .select('*, book:books(*)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (loan.book) {
    await supabase
      .from('books')
      .update({ available_copies: loan.book.available_copies + 1 })
      .eq('id', loan.book_id)
  }

  return Response.json({ loan: updated })
}
