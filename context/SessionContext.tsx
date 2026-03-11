'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface SessionValue {
  user: User | null
  isLoading: boolean
  isAnonymous: boolean
  /** Force-refresh session from cookies (call after server-side auth changes) */
  refresh: () => Promise<void>
  upgradeToEmail: (email: string) => Promise<{ error: string | null }>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Read current session from cookie on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Stay in sync whenever the session changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function refresh() {
    const supabase = createClient()
    // Triggers onAuthStateChange, which updates user state above
    await supabase.auth.refreshSession()
  }

  async function upgradeToEmail(email: string): Promise<{ error: string | null }> {
    const res = await fetch('/api/auth/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    return { error: data.error ?? null }
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        isLoading,
        isAnonymous: user?.is_anonymous ?? true,
        refresh,
        upgradeToEmail,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
