import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/server'
import { getLibrarySettings } from '@/lib/library/settings'
import { LoanCard } from '@/components/borrow/LoanCard'
import { isActiveLoan, isPendingLoan, isRejectedLoan, isReturnedLoan } from '@/lib/loans/status'

export default async function StudentBorrowPage() {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()
  const settings = await getLibrarySettings()
  const { data: loans } = await supabase
    .from('loans')
    .select('*, book:books(*)')
    .eq('user_id', user.id)
    .order('borrowed_at', { ascending: false })

  const allLoans = (loans ?? []) as import('@/types').Loan[]
  const pending = allLoans.filter(isPendingLoan)
  const active = allLoans.filter(isActiveLoan)
  const history = allLoans.filter((l) => isReturnedLoan(l) || isRejectedLoan(l))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Loans</h1>
        <p className="text-sm text-muted-foreground">Pending requests, active loans, and history</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Pending Approval ({pending.length})</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pending.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              fineRatePerDay={settings.fine_rate_per_day}
              defaultLoanDays={settings.default_loan_days}
            />
          ))}
          {pending.length === 0 && (
            <p className="text-sm text-muted-foreground">No pending borrow requests.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Active ({active.length})</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              fineRatePerDay={settings.fine_rate_per_day}
              defaultLoanDays={settings.default_loan_days}
            />
          ))}
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground">No active loans. Browse books to borrow.</p>
          )}
        </div>
      </section>

      {history.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">History</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {history.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                fineRatePerDay={settings.fine_rate_per_day}
                defaultLoanDays={settings.default_loan_days}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
