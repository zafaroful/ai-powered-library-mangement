'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { LibrarySettingsForm } from '@/components/settings/LibrarySettingsForm'
import { Skeleton } from '@/components/ui/skeleton'
import type { LibrarySettings } from '@/types'
import { DEFAULT_LIBRARY_SETTINGS } from '@/lib/library/constants'

export default function AdminSettingsPage() {
  const { user, loading, patchUser } = useUser()
  const [librarySettings, setLibrarySettings] = useState<LibrarySettings>(DEFAULT_LIBRARY_SETTINGS)
  const [libraryLoading, setLibraryLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/library')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setLibrarySettings(data.settings)
      })
      .finally(() => setLibraryLoading(false))
  }, [])

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
        <p className="text-sm text-muted-foreground">
          Library configuration and your account
        </p>
      </div>
      {libraryLoading ? (
        <Skeleton className="h-48 w-full max-w-lg" />
      ) : (
        <LibrarySettingsForm initialSettings={librarySettings} />
      )}
      <SettingsForm user={user} showMatric={false} onProfileSaved={patchUser} />
    </div>
  )
}
