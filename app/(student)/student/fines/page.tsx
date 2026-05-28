import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/server'
import { formatCurrency, calculateFine, FINE_RATE_PER_DAY, getDaysOverdue } from '@/lib/utils/fines'
import { formatDate } from '@/lib/utils/dates'
import { isActiveLoan } from '@/lib/loans/status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isOverdue } from '@/lib/utils/dates'

export default async function StudentFinesPage() {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: loans } = await supabase
    .from('loans')
    .select('*, book:books(*)')
    .eq('user_id', user.id)
    .order('borrowed_at', { ascending: false })

  const returnedWithFines = (loans ?? []).filter((l) => l.returned_at && l.fine_amount > 0)
  const activeOverdue = (loans ?? []).filter(
    (l) => isActiveLoan(l) && l.due_date && isOverdue(l.due_date)
  )

  const accruedFines = activeOverdue.reduce(
    (sum, l) => sum + calculateFine(l.due_date),
    0
  )
  const paidFines = returnedWithFines.reduce((sum, l) => sum + Number(l.fine_amount), 0)
  const totalOwed = accruedFines + paidFines

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Fines</h1>
        <p className="text-sm text-muted-foreground">
          Overdue charges at RM {FINE_RATE_PER_DAY.toFixed(2)}/day after your due date
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
                  {formatCurrency(calculateFine(loan.due_date!))}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {returnedWithFines.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Past Fines</h2>
          {returnedWithFines.map((loan) => (
            <Card key={loan.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">{loan.book?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Returned {new Date(loan.returned_at!).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-medium text-destructive">
                  {formatCurrency(loan.fine_amount)}
                </span>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {activeOverdue.length === 0 && returnedWithFines.length === 0 && (
        <p className="text-sm text-muted-foreground">No fines. Keep returning books on time!</p>
      )}
    </div>
  )
}
