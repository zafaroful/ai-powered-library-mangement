'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ReserveButton({
  bookId,
  unavailable,
}: {
  bookId: string
  /** Show reserve action only when no copies are available */
  unavailable: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReserve() {
    setLoading(true)
    setMessage(null)
    setError(null)

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId }),
    })

    if (res.ok) {
      setMessage('Reserved — we will notify you when it is ready')
      router.push('/student/reservations')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to reserve')
    }
    setLoading(false)
  }

  if (!unavailable) return null

  return (
    <div className="space-y-2">
      <Button onClick={handleReserve} disabled={loading}>
        {loading ? 'Reserving...' : 'Reserve Book'}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
