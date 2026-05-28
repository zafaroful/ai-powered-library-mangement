'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { LoanApprovalStatus } from '@/types'

export function LoanApprovalActions({
  loanId,
  status,
}: {
  loanId: string
  status: LoanApprovalStatus
}) {
  const router = useRouter()

  async function updateStatus(newStatus: 'active' | 'rejected') {
    await fetch(`/api/loans/${loanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  if (status !== 'pending') return null

  return (
    <div className="flex gap-1">
      <Button size="sm" onClick={() => updateStatus('active')}>
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => updateStatus('rejected')}>
        Reject
      </Button>
    </div>
  )
}
