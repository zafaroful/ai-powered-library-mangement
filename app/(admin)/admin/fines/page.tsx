import { createClient } from '@/lib/supabase/server'
import {
  formatCurrency,
  calculateFine,
  FINE_RATE_PER_DAY,
  getDaysOverdue,
} from '@/lib/utils/fines'
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
import type { Loan } from '@/types'

export default async function AdminFinesPage() {
  const supabase = await createClient()
  const { data: loans } = await supabase
    .from('loans')
    .select('*, book:books(*), user:users(*)')
    .order('returned_at', { ascending: false })

  const allLoans = (loans ?? []) as Loan[]
  const activeOverdue = allLoans.filter(
    (l) => isActiveLoan(l) && l.due_date && isOverdue(l.due_date)
  )
  const returnedWithFines = allLoans.filter((l) => l.returned_at && l.fine_amount > 0)

  const accruedFines = activeOverdue.reduce(
    (sum, l) => sum + calculateFine(l.due_date!),
    0
  )
  const collectedFines = returnedWithFines.reduce(
    (sum, l) => sum + Number(l.fine_amount),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fines</h1>
        <p className="text-sm text-muted-foreground">
          Overdue rate: RM {FINE_RATE_PER_DAY.toFixed(2)} per day after due date
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
            <p className="text-2xl font-semibold">{formatCurrency(collectedFines)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {returnedWithFines.length} returned with fines
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
                      {formatCurrency(calculateFine(loan.due_date!))}
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
                <TableHead>Returned</TableHead>
                <TableHead className="text-right">Fine</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnedWithFines.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.user?.full_name}</TableCell>
                  <TableCell>{loan.book?.title}</TableCell>
                  <TableCell>
                    {loan.due_date ? formatDate(loan.due_date) : '—'}
                  </TableCell>
                  <TableCell>
                    {loan.returned_at ? formatDate(loan.returned_at) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatCurrency(loan.fine_amount)}
                  </TableCell>
                </TableRow>
              ))}
              {returnedWithFines.length === 0 && (
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
