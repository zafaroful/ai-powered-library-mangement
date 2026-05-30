'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen } from 'lucide-react'
import { APP_NAME } from '@/lib/constants/brand'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

function formatLoginError(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  return message
}

function clearReadonlyOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.removeAttribute('readonly')
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(formatLoginError(authError.message))
      setLoading(false)
      return
    }

    const roleRes = await fetch('/api/auth/role')
    const { role } = await roleRes.json()

    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'student') {
      router.push('/student')
    } else {
      setError(
        'Signed in, but no Read Nest profile found. Ask an admin to add your account in the users table with role admin.'
      )
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="size-6" />
        </div>
        <CardTitle className="text-2xl font-semibold">{APP_NAME}</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} autoComplete="off">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={clearReadonlyOnFocus}
              readOnly
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={clearReadonlyOnFocus}
              readOnly
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="off"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Register as student
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
