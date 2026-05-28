import type { Loan } from '@/types'

export function isPendingLoan(loan: Pick<Loan, 'status'>): boolean {
  return loan.status === 'pending'
}

export function isActiveLoan(loan: Pick<Loan, 'status' | 'returned_at'>): boolean {
  return loan.status === 'active' && !loan.returned_at
}

export function isReturnedLoan(loan: Pick<Loan, 'returned_at'>): boolean {
  return !!loan.returned_at
}

export function isRejectedLoan(loan: Pick<Loan, 'status'>): boolean {
  return loan.status === 'rejected'
}
