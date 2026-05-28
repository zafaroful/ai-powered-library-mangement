import { createClient } from '@/lib/supabase/server'
import { getLibrarySettings } from '@/lib/library/settings'
import { LoanCard } from '@/components/borrow/LoanCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isOverdue } from '@/lib/utils/dates'
import { isActiveLoan, isPendingLoan, isReturnedLoan } from '@/lib/loans/status'
import type { Loan } from '@/types'

export default async function AdminLoansPage() {
  const supabase = await createClient()
  const settings = await getLibrarySettings()
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*, book:books(*), user:users(*)')
    .order('status', { ascending: true })
    .order('borrowed_at', { ascending: false, nullsFirst: true })

  const allLoans = (loans ?? []) as Loan[]
  const pending = allLoans.filter(isPendingLoan)
  const active = allLoans.filter(isActiveLoan)
  const overdue = active.filter((l) => l.due_date && isOverdue(l.due_date))
  const returned = allLoans.filter(isReturnedLoan)
  const defaultTab = pending.length > 0 ? 'pending' : 'active'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Loans</h1>
        <p className="text-sm text-muted-foreground">Manage borrowing requests and active loans</p>
        {error && (
          <p className="mt-2 text-sm text-destructive">
            Could not load loans: {error.message}. If you are setting up the project, run
            migration 009_fix_rls_recursion.sql in Supabase SQL Editor.
          </p>
        )}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="returned">Returned ({returned.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="grid gap-4 md:grid-cols-2 mt-4">
          {pending.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              showUser
              showApprovalActions
              fineRatePerDay={settings.fine_rate_per_day}
              defaultLoanDays={settings.default_loan_days}
            />
          ))}
          {pending.length === 0 && (
            <p className="text-sm text-muted-foreground">No pending borrow requests.</p>
          )}
        </TabsContent>
        <TabsContent value="active" className="grid gap-4 md:grid-cols-2 mt-4">
          {active.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              showUser
              fineRatePerDay={settings.fine_rate_per_day}
              defaultLoanDays={settings.default_loan_days}
            />
          ))}
          {active.length === 0 && <p className="text-sm text-muted-foreground">No active loans.</p>}
        </TabsContent>
        <TabsContent value="overdue" className="grid gap-4 md:grid-cols-2 mt-4">
          {overdue.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              showUser
              fineRatePerDay={settings.fine_rate_per_day}
              defaultLoanDays={settings.default_loan_days}
            />
          ))}
          {overdue.length === 0 && <p className="text-sm text-muted-foreground">No overdue loans.</p>}
        </TabsContent>
        <TabsContent value="returned" className="grid gap-4 md:grid-cols-2 mt-4">
          {returned.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              showUser
              fineRatePerDay={settings.fine_rate_per_day}
              defaultLoanDays={settings.default_loan_days}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
