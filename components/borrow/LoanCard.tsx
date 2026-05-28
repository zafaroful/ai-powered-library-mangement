import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate, isOverdue, isDueSoon } from '@/lib/utils/dates'
import { formatCurrency, formatOverdueFineLabel, FINE_RATE_PER_DAY } from '@/lib/utils/fines'
import { DEFAULT_LOAN_DAYS, getDueDate } from '@/lib/utils/dates'
import { isActiveLoan, isPendingLoan, isRejectedLoan } from '@/lib/loans/status'
import type { Loan } from '@/types'
import { ReturnLoanButton } from './ReturnLoanButton'
import { LoanApprovalActions } from './LoanApprovalActions'

export function LoanCard({
  loan,
  showUser = false,
  showApprovalActions = false,
}: {
  loan: Loan
  showUser?: boolean
  showApprovalActions?: boolean
}) {
  const pending = isPendingLoan(loan)
  const rejected = isRejectedLoan(loan)
  const active = isActiveLoan(loan)
  const overdue = active && loan.due_date && isOverdue(loan.due_date)
  const dueSoon = active && loan.due_date && isDueSoon(loan.due_date)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">{loan.book?.title ?? 'Unknown Book'}</h3>
            <p className="text-xs text-muted-foreground">{loan.book?.author}</p>
            {showUser && loan.user && (
              <p className="text-xs text-muted-foreground mt-1">{loan.user.full_name}</p>
            )}
          </div>
          {loan.returned_at ? (
            <Badge variant="secondary">Returned</Badge>
          ) : pending ? (
            <Badge variant="outline">Pending approval</Badge>
          ) : rejected ? (
            <Badge variant="secondary">Rejected</Badge>
          ) : overdue ? (
            <Badge variant="destructive">Overdue</Badge>
          ) : dueSoon ? (
            <Badge variant="outline">Due soon</Badge>
          ) : (
            <Badge>Active</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground space-y-1">
          {pending ? (
            <>
              <p>Requested — awaiting admin approval</p>
              <p className="text-muted-foreground">
                If approved today: {DEFAULT_LOAN_DAYS}-day loan · due {formatDate(getDueDate())}
              </p>
            </>
          ) : rejected ? (
            <p>Request was rejected</p>
          ) : (
            <>
              {loan.borrowed_at && <p>Borrowed: {formatDate(loan.borrowed_at)}</p>}
              {loan.due_date && (
                <p className={overdue ? 'text-destructive font-medium' : undefined}>
                  Due: {formatDate(loan.due_date)}
                </p>
              )}
            </>
          )}
          {overdue && loan.due_date && (
            <p className="text-destructive font-medium">
              {formatOverdueFineLabel(loan.due_date)}
            </p>
          )}
          {loan.returned_at && loan.fine_amount > 0 && (
            <p className="text-destructive">Fine paid on return: {formatCurrency(loan.fine_amount)}</p>
          )}
          {active && !overdue && loan.due_date && (
            <p className="text-muted-foreground">
              Fine if returned late: RM {FINE_RATE_PER_DAY.toFixed(2)}/day after due date
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {showApprovalActions && pending && (
            <LoanApprovalActions loanId={loan.id} status={loan.status} />
          )}
          {active && <ReturnLoanButton loanId={loan.id} />}
        </div>
      </CardContent>
    </Card>
  )
}
