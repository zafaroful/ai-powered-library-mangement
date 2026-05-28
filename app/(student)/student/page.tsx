import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, calculateFine } from '@/lib/utils/fines'
import { formatDate, isDueSoon, isOverdue } from '@/lib/utils/dates'
import { isActiveLoan, isPendingLoan } from '@/lib/loans/status'
import type { Loan } from '@/types'
import { BookMarked, ArrowLeftRight, CalendarClock, CircleDollarSign } from 'lucide-react'

export default async function StudentDashboardPage() {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()

  const [
    { data: loans },
    { data: reservations },
  ] = await Promise.all([
    supabase
      .from('loans')
      .select('*, book:books(*)')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .is('returned_at', null)
      .order('due_date'),
    supabase
      .from('reservations')
      .select('*, book:books(*)')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .order('reserved_at', { ascending: false })
      .limit(5),
  ])

  const allLoans = (loans ?? []) as Loan[]
  const activeLoans = allLoans.filter(isActiveLoan)
  const pendingLoans = allLoans.filter(isPendingLoan)
  const dueSoon = activeLoans.filter((l) => l.due_date && isDueSoon(l.due_date))
  const overdue = activeLoans.filter((l) => l.due_date && isOverdue(l.due_date))
  const finesOwed = overdue.reduce((sum, l) => sum + calculateFine(l.due_date!), 0)
  const readyReservations = (reservations ?? []).filter((r) => r.status === 'ready')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.full_name}</h1>
        <p className="text-sm text-muted-foreground">Your library activity at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowLeftRight className="size-4" /> Active Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeLoans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarClock className="size-4" /> Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{dueSoon.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarClock className="size-4" /> Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{reservations?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CircleDollarSign className="size-4" /> Fines Owed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">{formatCurrency(finesOwed)}</p>
          </CardContent>
        </Card>
      </div>

      {pendingLoans.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingLoans.map((loan) => (
              <p key={loan.id} className="text-sm">{loan.book?.title}</p>
            ))}
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/borrow">View borrow requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {readyReservations.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Ready for Pickup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {readyReservations.map((res) => (
              <p key={res.id} className="text-sm">{res.book?.title}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Active Loans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeLoans.slice(0, 5).map((loan) => (
            <div key={loan.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{loan.book?.title}</span>
              <div className="flex flex-col items-end gap-1">
                {loan.due_date && (
                  <span className={isOverdue(loan.due_date) ? 'text-destructive' : 'text-muted-foreground'}>
                    Due {formatDate(loan.due_date)}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {loan.due_date && isOverdue(loan.due_date) && (
                    <>
                      <Badge variant="destructive">Overdue</Badge>
                      <span className="text-destructive text-xs font-medium">
                        {formatCurrency(calculateFine(loan.due_date))}
                      </span>
                    </>
                  )}
                  {loan.due_date && isDueSoon(loan.due_date) && !isOverdue(loan.due_date) && (
                    <Badge variant="outline">Due soon</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {activeLoans.length === 0 && (
            <p className="text-sm text-muted-foreground">No active loans.</p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/borrow">View all loans</Link>
          </Button>
        </CardContent>
      </Card>

      <Button asChild>
        <Link href="/student/books">
          <BookMarked className="size-4" />
          Browse Books
        </Link>
      </Button>
    </div>
  )
}
