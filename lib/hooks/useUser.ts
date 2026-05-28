'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUser(data)
      setLoading(false)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  function patchUser(updates: Partial<User>) {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  return {
    user,
    loading,
    patchUser,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
  }
}
