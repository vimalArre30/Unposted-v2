'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UseSessionReturn {
  user: User | null
  isLoading: boolean
  isAnonymous: boolean
  upgradeToEmail: (email: string) => Promise<{ error: string | null }>
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Read the current session from the cookie (no network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Keep the local state in sync when the session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const upgradeToEmail = async (email: string): Promise<{ error: string | null }> => {
    const res = await fetch('/api/auth/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    return { error: data.error ?? null }
  }

  return {
    user,
    isLoading,
    // Supabase sets is_anonymous on the User object for anonymous sessions
    isAnonymous: user?.is_anonymous ?? true,
    upgradeToEmail,
  }
}
