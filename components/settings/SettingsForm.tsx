'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BOOK_CATEGORIES } from '@/lib/constants/categories'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ThemeSwitcher } from '@/components/settings/ThemeSwitcher'
import { cn } from '@/lib/utils'

interface SettingsFormProps {
  user: User
  showMatric?: boolean
  onProfileSaved?: (updates: Partial<User>) => void
}

export function SettingsForm({ user, showMatric = user.role === 'student', onProfileSaved }: SettingsFormProps) {
  const [fullName, setFullName] = useState(user.full_name)
  const [matricNo, setMatricNo] = useState(user.matric_no ?? '')
  const [interests, setInterests] = useState<string[]>(user.interests ?? [])

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [interestsSaving, setInterestsSaving] = useState(false)
  const [interestsMessage, setInterestsMessage] = useState<string | null>(null)
  const [interestsError, setInterestsError] = useState<string | null>(null)

  useEffect(() => {
    setFullName(user.full_name)
    setMatricNo(user.matric_no ?? '')
    setInterests(user.interests ?? [])
  }, [user])

  function toggleInterest(category: string) {
    setInterests((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileMessage(null)

    const trimmedName = fullName.trim()
    if (!trimmedName) {
      setProfileError('Name cannot be empty.')
      setProfileSaving(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({
        full_name: trimmedName,
        ...(showMatric ? { matric_no: matricNo.trim() || null } : {}),
      })
      .eq('id', user.id)

    setProfileSaving(false)
    if (error) {
      setProfileError(error.message)
      return
    }

    setProfileMessage('Profile updated.')
    onProfileSaved?.({
      full_name: trimmedName,
      ...(showMatric ? { matric_no: matricNo.trim() || undefined } : {}),
    })
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      setPasswordSaving(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      setPasswordSaving(false)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordError('Current password is incorrect.')
      setPasswordSaving(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    setPasswordSaving(false)
    if (updateError) {
      setPasswordError(updateError.message)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Password updated successfully.')
  }

  async function handleSaveInterests(e: React.FormEvent) {
    e.preventDefault()
    setInterestsSaving(true)
    setInterestsError(null)
    setInterestsMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ interests })
      .eq('id', user.id)

    setInterestsSaving(false)
    if (error) {
      setInterestsError(error.message)
      return
    }

    setInterestsMessage('Interests saved.')
    onProfileSaved?.({ interests })
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileError && (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}
            {profileMessage && (
              <Alert>
                <AlertDescription>{profileMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            {showMatric && (
              <div className="space-y-2">
                <Label htmlFor="matricNo">Matric No</Label>
                <Input
                  id="matricNo"
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            )}
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your sign-in password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            {passwordMessage && (
              <Alert>
                <AlertDescription>{passwordMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose light, dark, or match your system theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reading interests</CardTitle>
          <CardDescription>
            Select categories you enjoy. These help personalize book recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveInterests} className="space-y-4">
            {interestsError && (
              <Alert variant="destructive">
                <AlertDescription>{interestsError}</AlertDescription>
              </Alert>
            )}
            {interestsMessage && (
              <Alert>
                <AlertDescription>{interestsMessage}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              {BOOK_CATEGORIES.map((category) => {
                const selected = interests.includes(category)
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleInterest(category)}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Badge
                      variant={selected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer px-3 py-1 text-sm transition-colors',
                        selected && 'ring-2 ring-primary/30'
                      )}
                    >
                      {category}
                    </Badge>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {interests.length === 0
                ? 'No interests selected yet.'
                : `${interests.length} selected`}
            </p>
            <Button type="submit" disabled={interestsSaving}>
              {interestsSaving ? 'Saving...' : 'Save interests'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
