'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function BorrowButton({ bookId, available }: { bookId: string; available: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleBorrow() {
    setLoading(true)
    setMessage(null)
    setError(null)

    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId }),
    })

    if (res.ok) {
      setMessage('Request submitted — awaiting admin approval')
      router.push('/student/borrow')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit borrow request')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleBorrow} disabled={!available || loading}>
        {loading ? 'Submitting...' : available ? 'Request to Borrow' : 'Unavailable'}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
