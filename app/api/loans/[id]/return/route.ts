import { createAdminClient } from '@/lib/supabase/admin'
import { calculateFine, getDaysOverdue } from '@/lib/utils/fines'
import { getLibrarySettings } from '@/lib/library/settings'
import { getSessionUser } from '@/lib/auth/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()
  const settings = await getLibrarySettings()

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
    ? calculateFine(loan.due_date, returnedAt, settings.fine_rate_per_day)
    : 0
  const daysOverdue = loan.due_date ? getDaysOverdue(loan.due_date, new Date(returnedAt)) : 0

  const { data: updated, error } = await supabase
    .from('loans')
    .update({ returned_at: returnedAt, fine_amount: fineAmount })
    .eq('id', id)
    .select('*, book:books(*)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (fineAmount > 0) {
    await supabase.from('fines').upsert(
      {
        loan_id: id,
        user_id: loan.user_id,
        book_id: loan.book_id,
        amount: fineAmount,
        days_overdue: daysOverdue,
        status: 'assessed',
        assessed_at: returnedAt,
      },
      { onConflict: 'loan_id' }
    )
  }

  if (loan.book) {
    await supabase
      .from('books')
      .update({ available_copies: loan.book.available_copies + 1 })
      .eq('id', loan.book_id)
  }

  return Response.json({ loan: updated })
}
