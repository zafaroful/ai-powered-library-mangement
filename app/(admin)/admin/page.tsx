import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, calculateFine } from '@/lib/utils/fines'
import { getLibrarySettings } from '@/lib/library/settings'
import { formatDate } from '@/lib/utils/dates'
import { isOverdue } from '@/lib/utils/dates'
import {
  BookMarked,
  ArrowLeftRight,
  AlertTriangle,
  CircleDollarSign,
  Users,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const settings = await getLibrarySettings()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalBooks },
    { count: totalStudents },
    { data: activeLoans },
    { data: allLoans },
  ] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('loans').select('*, book:books(*)').eq('status', 'active').is('returned_at', null),
    supabase.from('loans').select('fine_amount, borrowed_at').eq('status', 'active').gte('borrowed_at', today.toISOString()),
  ])

  const overdue = (activeLoans ?? []).filter((l) => l.due_date && isOverdue(l.due_date))
  const loansToday = allLoans?.length ?? 0
  const totalFines = overdue.reduce(
    (sum, l) => sum + calculateFine(l.due_date!, undefined, settings.fine_rate_per_day),
    0
  )

  const stats = [
    { label: 'Total Books', value: totalBooks ?? 0, icon: BookMarked, href: '/admin/books' },
    { label: 'Students', value: totalStudents ?? 0, icon: Users, href: '/admin/users' },
    { label: 'Active Loans', value: activeLoans?.length ?? 0, icon: ArrowLeftRight, href: '/admin/loans' },
    { label: 'Overdue', value: overdue.length, icon: AlertTriangle, href: '/admin/loans' },
    { label: 'Loans Today', value: loansToday, icon: ArrowLeftRight, href: '/admin/loans' },
    { label: 'Est. Fines', value: formatCurrency(totalFines), icon: CircleDollarSign, href: '/admin/fines' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Library overview and quick actions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {overdue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Overdue Loans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 5).map((loan) => (
              <div key={loan.id} className="flex justify-between gap-2 text-sm">
                <span>{loan.book?.title}</span>
                <span className="text-destructive text-right shrink-0">
                  Due {loan.due_date ? formatDate(loan.due_date) : '—'}
                  {loan.due_date && (
                    <> · {formatCurrency(calculateFine(loan.due_date, undefined, settings.fine_rate_per_day))}</>
                  )}
                </span>
              </div>
            ))}
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/loans">View all loans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/admin/books/new">Add Book</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">View Reports</Link>
        </Button>
      </div>
    </div>
  )
}
