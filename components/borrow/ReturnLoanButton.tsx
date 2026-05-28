'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ReturnLoanButton({ loanId }: { loanId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReturn() {
    setLoading(true)
    const res = await fetch(`/api/loans/${loanId}/return`, { method: 'POST' })
    if (res.ok) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReturn} disabled={loading}>
      {loading ? 'Returning...' : 'Return'}
    </Button>
  )
}
