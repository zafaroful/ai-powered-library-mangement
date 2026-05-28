import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { getLibrarySettings, updateLibrarySettings } from '@/lib/library/settings'

export async function GET() {
  const user = await requireRole('admin')
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await getLibrarySettings()
  return Response.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const user = await requireRole('admin')
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const fine_rate_per_day = Number(body.fine_rate_per_day)
  const default_loan_days = Number(body.default_loan_days)

  if (!Number.isFinite(fine_rate_per_day) || fine_rate_per_day < 0) {
    return Response.json({ error: 'Invalid fine rate' }, { status: 400 })
  }
  if (!Number.isInteger(default_loan_days) || default_loan_days < 1) {
    return Response.json({ error: 'Loan period must be at least 1 day' }, { status: 400 })
  }

  const { settings, error } = await updateLibrarySettings(
    { fine_rate_per_day, default_loan_days },
    user.id
  )

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ settings })
}
