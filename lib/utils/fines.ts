export const FINE_RATE_PER_DAY = 0.5 // RM 0.50 per day overdue

export function getDaysOverdue(
  dueDate: string | Date,
  asOf: Date = new Date()
): number {
  const due = new Date(dueDate)
  if (asOf <= due) return 0
  const diffMs = asOf.getTime() - due.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function calculateFine(dueDate: string | Date, returnedAt?: string | Date): number {
  const daysOverdue = getDaysOverdue(dueDate, returnedAt ? new Date(returnedAt) : new Date())
  return daysOverdue * FINE_RATE_PER_DAY
}

/** Human-readable overdue fine line for UI */
export function formatOverdueFineLabel(dueDate: string | Date): string {
  const days = getDaysOverdue(dueDate)
  if (days <= 0) return ''
  const amount = calculateFine(dueDate)
  return `${days} day${days === 1 ? '' : 's'} overdue · ${formatCurrency(amount)} (RM ${FINE_RATE_PER_DAY.toFixed(2)}/day)`
}

export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`
}
