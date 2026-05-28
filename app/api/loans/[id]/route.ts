import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDueDate } from '@/lib/utils/dates'
import { getLibrarySettings } from '@/lib/library/settings'
import { requireRole } from '@/lib/auth/server'
import type { LoanApprovalStatus } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json() as { status: LoanApprovalStatus }

  if (status !== 'active' && status !== 'rejected') {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: loan } = await supabase
    .from('loans')
    .select('*, book:books(*)')
    .eq('id', id)
    .single()

  if (!loan) return Response.json({ error: 'Loan not found' }, { status: 404 })
  if (loan.status !== 'pending') {
    return Response.json({ error: 'Only pending requests can be updated' }, { status: 400 })
  }

  if (status === 'active') {
    const now = new Date()
    const settings = await getLibrarySettings()
    const { data, error } = await supabase
      .from('loans')
      .update({
        status: 'active',
        borrowed_at: now.toISOString(),
        due_date: getDueDate(now, settings.default_loan_days).toISOString(),
      })
      .eq('id', id)
      .select('*, book:books(*), user:users(*)')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ loan: data })
  }

  const { data, error } = await supabase
    .from('loans')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select('*, book:books(*), user:users(*)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (loan.book) {
    await supabase
      .from('books')
      .update({ available_copies: loan.book.available_copies + 1 })
      .eq('id', loan.book_id)
  }

  return Response.json({ loan: data })
}
