export const DEFAULT_LOAN_DAYS = 14

export function getDueDate(borrowedAt: Date = new Date(), loanDays = DEFAULT_LOAN_DAYS): Date {
  const due = new Date(borrowedAt)
  due.setDate(due.getDate() + loanDays)
  return due
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueDate: string | Date): boolean {
  return new Date(dueDate) < new Date()
}

export function isDueSoon(dueDate: string | Date, withinDays = 3): boolean {
  const days = daysUntil(dueDate)
  return days >= 0 && days <= withinDays
}
