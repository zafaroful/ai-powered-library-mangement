import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/server'
import { formatCurrency, calculateFine, getDaysOverdue } from '@/lib/utils/fines'
import { getLibrarySettings } from '@/lib/library/settings'
import { formatDate } from '@/lib/utils/dates'
import { isActiveLoan } from '@/lib/loans/status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isOverdue } from '@/lib/utils/dates'
import type { Fine } from '@/types'

export default async function StudentFinesPage() {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()
  const settings = await getLibrarySettings()
  const rate = settings.fine_rate_per_day

  const [{ data: loans }, { data: finesRows }] = await Promise.all([
    supabase
      .from('loans')
      .select('*, book:books(*)')
      .eq('user_id', user.id)
      .order('borrowed_at', { ascending: false }),
    supabase
      .from('fines')
      .select('*, book:books(*)')
      .eq('user_id', user.id)
      .order('assessed_at', { ascending: false }),
  ])

  const collectedFines = (finesRows ?? []) as Fine[]
  const activeOverdue = (loans ?? []).filter(
    (l) => isActiveLoan(l) && l.due_date && isOverdue(l.due_date)
  )

  const accruedFines = activeOverdue.reduce(
    (sum, l) => sum + calculateFine(l.due_date!, undefined, rate),
    0
  )
  const paidFines = collectedFines.reduce((sum, f) => sum + Number(f.amount), 0)
  const totalOwed = accruedFines + paidFines

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Fines</h1>
        <p className="text-sm text-muted-foreground">
          Overdue charges at RM {rate.toFixed(2)}/day after your due date
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Owed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-destructive">{formatCurrency(totalOwed)}</p>
          {accruedFines > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Includes {formatCurrency(accruedFines)} from active overdue loans
            </p>
          )}
        </CardContent>
      </Card>

      {activeOverdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Active Overdue</h2>
          {activeOverdue.map((loan) => (
            <Card key={loan.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">{loan.book?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(loan.due_date!)} · {getDaysOverdue(loan.due_date!)} days overdue
                  </p>
                </div>
                <Badge variant="destructive">
                  {formatCurrency(calculateFine(loan.due_date!, undefined, rate))}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {collectedFines.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Past Fines</h2>
          {collectedFines.map((fine) => (
            <Card key={fine.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">{fine.book?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Assessed {formatDate(fine.assessed_at)}
                  </p>
                </div>
                <span className="text-sm font-medium text-destructive">
                  {formatCurrency(fine.amount)}
                </span>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {activeOverdue.length === 0 && collectedFines.length === 0 && (
        <p className="text-sm text-muted-foreground">No fines. Keep returning books on time!</p>
      )}
    </div>
  )
}
