'use client'

import { useEffect, useState } from 'react'
import type { LibrarySettings } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LibrarySettingsFormProps {
  initialSettings: LibrarySettings
}

export function LibrarySettingsForm({ initialSettings }: LibrarySettingsFormProps) {
  const [fineRate, setFineRate] = useState(String(initialSettings.fine_rate_per_day))
  const [loanDays, setLoanDays] = useState(String(initialSettings.default_loan_days))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFineRate(String(initialSettings.fine_rate_per_day))
    setLoanDays(String(initialSettings.default_loan_days))
  }, [initialSettings])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const fine_rate_per_day = parseFloat(fineRate)
    const default_loan_days = parseInt(loanDays, 10)

    if (!Number.isFinite(fine_rate_per_day) || fine_rate_per_day < 0) {
      setError('Fine rate must be a non-negative number.')
      setSaving(false)
      return
    }
    if (!Number.isInteger(default_loan_days) || default_loan_days < 1) {
      setError('Loan period must be at least 1 day.')
      setSaving(false)
      return
    }

    const res = await fetch('/api/settings/library', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fine_rate_per_day, default_loan_days }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to save settings.')
      return
    }

    setMessage('Library settings updated.')
    if (data.settings) {
      setFineRate(String(data.settings.fine_rate_per_day))
      setLoanDays(String(data.settings.default_loan_days))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Library configuration</CardTitle>
        <CardDescription>
          Fine rate and default loan period used for new loans and overdue calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="fine_rate">Fine rate (RM per day)</Label>
            <Input
              id="fine_rate"
              type="number"
              min="0"
              step="0.01"
              value={fineRate}
              onChange={(e) => setFineRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loan_days">Default loan period (days)</Label>
            <Input
              id="loan_days"
              type="number"
              min="1"
              step="1"
              value={loanDays}
              onChange={(e) => setLoanDays(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save library settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
