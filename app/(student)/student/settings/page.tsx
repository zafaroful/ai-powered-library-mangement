'use client'

import { useUser } from '@/lib/hooks/useUser'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { Skeleton } from '@/components/ui/skeleton'

export default function StudentSettingsPage() {
  const { user, loading, patchUser } = useUser()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full max-w-lg" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>
      <SettingsForm user={user} onProfileSaved={patchUser} />
    </div>
  )
}
