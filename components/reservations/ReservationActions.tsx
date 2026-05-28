'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { ReservationStatus } from '@/types'

export function ReservationActions({
  reservationId,
  status,
}: {
  reservationId: string
  status: ReservationStatus
}) {
  const router = useRouter()

  async function updateStatus(newStatus: ReservationStatus) {
    await fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  return (
    <div className="flex gap-1">
      {status === 'pending' && (
        <Button size="sm" onClick={() => updateStatus('ready')}>
          Mark Ready
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => updateStatus('cancelled')}>
        Cancel
      </Button>
    </div>
  )
}
