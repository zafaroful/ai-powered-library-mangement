import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLibrarySettings } from '@/lib/library/settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoanCard } from '@/components/borrow/LoanCard'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const settings = await getLibrarySettings()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!user) notFound()

  const { data: loans } = await supabase
    .from('loans')
    .select('*, book:books(*)')
    .eq('user_id', id)
    .order('borrowed_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{user.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
          {user.matric_no && <p><span className="text-muted-foreground">Matric:</span> {user.matric_no}</p>}
          <Badge variant="secondary">{user.role}</Badge>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Recent Loans</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(loans ?? []).map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              fineRatePerDay={settings.fine_rate_per_day}
              defaultLoanDays={settings.default_loan_days}
            />
          ))}
          {(!loans || loans.length === 0) && (
            <p className="text-sm text-muted-foreground">No loan history.</p>
          )}
        </div>
      </div>
    </div>
  )
}
