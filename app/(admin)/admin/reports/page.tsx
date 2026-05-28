import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/fines'
import { isOverdue } from '@/lib/utils/dates'
import { upsertReportSnapshot } from '@/lib/library/reports'
import type { ReportMetrics } from '@/types'
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function AdminReportsPage() {
  const user = await getSessionUser()
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const periodStart = thirtyDaysAgo.toISOString().slice(0, 10)
  const periodEnd = new Date().toISOString().slice(0, 10)

  const [
    { data: recentLoans },
    { data: activeLoans },
    { data: books },
    { data: finesRows },
  ] = await Promise.all([
    supabase
      .from('loans')
      .select('book_id, book:books(title)')
      .eq('status', 'active')
      .not('borrowed_at', 'is', null)
      .gte('borrowed_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('loans')
      .select('*, book:books(*)')
      .eq('status', 'active')
      .is('returned_at', null),
    supabase.from('books').select('id, title, total_copies, available_copies'),
    supabase.from('fines').select('amount'),
  ])

  const bookBorrowCounts: Record<string, { title: string; count: number }> = {}
  for (const loan of recentLoans ?? []) {
    const bookData = loan.book
    const book = Array.isArray(bookData) ? bookData[0] : bookData
    if (!book?.title) continue
    const key = loan.book_id
    if (!bookBorrowCounts[key]) {
      bookBorrowCounts[key] = { title: book.title, count: 0 }
    }
    bookBorrowCounts[key].count++
  }

  const popularBooks = Object.values(bookBorrowCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const overdue = (activeLoans ?? []).filter((l) => l.due_date && isOverdue(l.due_date))
  const totalFines = (finesRows ?? []).reduce((sum, f) => sum + Number(f.amount), 0)
  const totalBooks = books?.length ?? 0
  const availableBooks = (books ?? []).filter((b) => b.available_copies > 0).length

  const metrics: ReportMetrics = {
    loansCount: recentLoans?.length ?? 0,
    overdueCount: overdue.length,
    availableBooks,
    totalBooks,
    totalFinesCollected: totalFines,
    popularBooks,
  }

  let lastSaved: string | null = null
  if (user?.role === 'admin') {
    const { generatedAt } = await upsertReportSnapshot(metrics, periodStart, periodEnd, user.id)
    lastSaved = generatedAt
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Last 30 days overview
          {lastSaved && (
            <span className="block text-xs mt-1">
              Snapshot saved {new Date(lastSaved).toLocaleString()}
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" /> Loans (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.loansCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="size-4" /> Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">{metrics.overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="size-4" /> Available Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.availableBooks}/{metrics.totalBooks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fines Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(metrics.totalFinesCollected)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular Books (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.popularBooks.map((book, i) => (
            <div key={book.title} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 justify-center">{i + 1}</Badge>
                {book.title}
              </span>
              <span className="text-muted-foreground">{book.count} borrows</span>
            </div>
          ))}
          {metrics.popularBooks.length === 0 && (
            <p className="text-sm text-muted-foreground">No borrowing activity in the last 30 days.</p>
          )}
        </CardContent>
      </Card>

      {overdue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Overdue Loans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.map((loan) => (
              <div key={loan.id} className="flex justify-between text-sm">
                <span>{loan.book?.title}</span>
                <span className="text-muted-foreground">
                  Due {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : '—'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
