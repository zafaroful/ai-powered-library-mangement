import { createClient } from '@/lib/supabase/server'
import {
  formatCurrency,
  calculateFine,
  getDaysOverdue,
} from '@/lib/utils/fines'
import { getLibrarySettings } from '@/lib/library/settings'
import { formatDate, isOverdue } from '@/lib/utils/dates'
import { isActiveLoan } from '@/lib/loans/status'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Fine, Loan } from '@/types'

export default async function AdminFinesPage() {
  const supabase = await createClient()
  const settings = await getLibrarySettings()
  const rate = settings.fine_rate_per_day

  const [{ data: loans }, { data: finesRows }] = await Promise.all([
    supabase.from('loans').select('*, book:books(*), user:users(*)').order('returned_at', { ascending: false }),
    supabase
      .from('fines')
      .select('*, book:books(*), user:users(*), loan:loans(due_date, returned_at)')
      .order('assessed_at', { ascending: false }),
  ])

  const allLoans = (loans ?? []) as Loan[]
  const collectedFines = (finesRows ?? []) as Fine[]
  const activeOverdue = allLoans.filter(
    (l) => isActiveLoan(l) && l.due_date && isOverdue(l.due_date)
  )

  const accruedFines = activeOverdue.reduce(
    (sum, l) => sum + calculateFine(l.due_date!, undefined, rate),
    0
  )
  const collectedTotal = collectedFines.reduce((sum, f) => sum + Number(f.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fines</h1>
        <p className="text-sm text-muted-foreground">
          Overdue rate: RM {rate.toFixed(2)} per day after due date
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accruing (not returned)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {formatCurrency(accruedFines)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeOverdue.length} active overdue loan{activeOverdue.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collected (on return)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(collectedTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {collectedFines.length} assessed fine{collectedFines.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
      </div>

      {activeOverdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Active overdue</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Days overdue</TableHead>
                  <TableHead className="text-right">Fine owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOverdue.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.user?.full_name}</TableCell>
                    <TableCell>{loan.book?.title}</TableCell>
                    <TableCell>{formatDate(loan.due_date!)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {getDaysOverdue(loan.due_date!)} days
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(calculateFine(loan.due_date!, undefined, rate))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Fines collected on return</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Assessed</TableHead>
                <TableHead className="text-right">Fine</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectedFines.map((fine) => {
                const loanData = fine.loan
                const loan = Array.isArray(loanData) ? loanData[0] : loanData
                return (
                  <TableRow key={fine.id}>
                    <TableCell>{fine.user?.full_name}</TableCell>
                    <TableCell>{fine.book?.title}</TableCell>
                    <TableCell>
                      {loan?.due_date ? formatDate(loan.due_date) : '—'}
                    </TableCell>
                    <TableCell>{formatDate(fine.assessed_at)}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(fine.amount)}
                    </TableCell>
                  </TableRow>
                )
              })}
              {collectedFines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No collected fines yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
