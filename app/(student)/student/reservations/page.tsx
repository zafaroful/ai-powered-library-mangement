import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default async function StudentReservationsPage() {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, book:books(*)')
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .order('reserved_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Reservations</h1>
        <p className="text-sm text-muted-foreground">Books you have reserved</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(reservations ?? []).map((res) => (
          <Card key={res.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium">{res.book?.title}</h3>
                <Badge variant={res.status === 'ready' ? 'default' : 'secondary'}>
                  {res.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{res.book?.author}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Reserved {new Date(res.reserved_at).toLocaleDateString()}
              </p>
              {res.status === 'ready' && (
                <p className="text-xs text-primary mt-1">Ready for pickup!</p>
              )}
            </CardContent>
          </Card>
        ))}
        {(!reservations || reservations.length === 0) && (
          <p className="text-sm text-muted-foreground">No reservations yet.</p>
        )}
      </div>
    </div>
  )
}
