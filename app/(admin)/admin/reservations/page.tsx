import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ReservationActions } from '@/components/reservations/ReservationActions'

export default async function AdminReservationsPage() {
  const supabase = await createClient()
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, book:books(*), user:users(*)')
    .neq('status', 'cancelled')
    .order('reserved_at', { ascending: true })

  const statusVariant = {
    pending: 'secondary' as const,
    ready: 'default' as const,
    cancelled: 'outline' as const,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reservations</h1>
        <p className="text-sm text-muted-foreground">Manage reservation queue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(reservations ?? []).map((res) => (
          <Card key={res.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">{res.book?.title}</h3>
                  <p className="text-xs text-muted-foreground">{res.user?.full_name}</p>
                </div>
                <Badge variant={statusVariant[res.status as keyof typeof statusVariant]}>
                  {res.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Reserved {new Date(res.reserved_at).toLocaleDateString()}
              </p>
              <ReservationActions reservationId={res.id} status={res.status} />
            </CardContent>
          </Card>
        ))}
        {(!reservations || reservations.length === 0) && (
          <p className="text-sm text-muted-foreground">No active reservations.</p>
        )}
      </div>
    </div>
  )
}
